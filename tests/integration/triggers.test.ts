import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildTenants, must, type Tenants } from "./fixtures"
import { admin, cleanup } from "./helpers"

let t: Tenants

beforeAll(async () => {
  t = await buildTenants()
})

afterAll(async () => {
  if (t) await cleanup([t.orgA.id, t.orgB.id], t.users)
})

const today = () => new Date().toISOString().slice(0, 10)

describe("permit status rules", () => {
  it("stamps approved_at when approving without a date", async () => {
    const row = await must(
      t.pmA.client
        .from("permits")
        .update({ status: "approved" })
        .eq("id", t.permit.id)
        .select()
        .single()
    )
    expect(row.approved_at).toBe(today())
    expect(row.submitted_at).toBeNull()
  })

  it("refuses to clear approved_at while approved", async () => {
    const { error } = await t.pmA.client
      .from("permits")
      .update({ approved_at: null })
      .eq("id", t.permit.id)
    expect(error?.code).toBe("23514")
  })

  it("stamps submitted_at and status_changed_at on submission", async () => {
    const row = await must(
      t.pmA.client
        .from("permits")
        .insert({
          org_id: t.orgA.id,
          project_id: t.project.id,
          name: "Electrical",
          status: "submitted",
        })
        .select()
        .single()
    )
    expect(row.submitted_at).toBe(today())
    expect(new Date(row.status_changed_at).getTime()).toBeGreaterThan(Date.now() - 60_000)
  })
})

describe("activity log", () => {
  it("records creation, status changes and assignment with the actor", async () => {
    const permit = await must(
      t.pmA.client
        .from("permits")
        .insert({ org_id: t.orgA.id, project_id: t.project.id, name: "Plumbing rough-in" })
        .select()
        .single()
    )
    await t.pmA.client.from("permits").update({ status: "under_review" }).eq("id", permit.id)
    await t.pmA.client
      .from("permits")
      .update({ assignee_id: t.adminA.id, notes: "Called the city" })
      .eq("id", permit.id)

    const { data } = await t.viewerA.client
      .from("activity_log")
      .select("action, actor_id, metadata, project_id")
      .eq("entity_id", permit.id)
      .order("id")
    expect(data?.map((a) => a.action)).toEqual(["created", "status_changed", "assigned", "updated"])
    expect(data?.every((a) => a.actor_id === t.pmA.id && a.project_id === t.project.id)).toBe(true)
    expect(data?.[1]?.metadata).toMatchObject({ from: "draft", to: "under_review" })
    expect(data?.[3]?.metadata).toMatchObject({ fields: ["notes"] })
  })

  it("records task completion and document uploads", async () => {
    await t.pmA.client.from("tasks").update({ status: "done" }).eq("id", t.task.id)
    const { data: task } = await admin()
      .from("tasks")
      .select("completed_at")
      .eq("id", t.task.id)
      .single()
    expect(task?.completed_at).not.toBeNull()

    const { data } = await t.viewerA.client
      .from("activity_log")
      .select("entity_type, action")
      .in("entity_id", [t.task.id, t.document.id])
    expect(data).toEqual(
      expect.arrayContaining([
        { entity_type: "task", action: "completed" },
        { entity_type: "document", action: "uploaded" },
      ])
    )
  })

  it("cannot be written or rewritten by clients", async () => {
    const { error } = await t.adminA.client.from("activity_log").insert({
      org_id: t.orgA.id,
      entity_type: "project",
      entity_id: t.project.id,
      action: "created",
    })
    expect(error?.code).toBe("42501")
  })
})

describe("event notifications", () => {
  it("notifies a new assignee but not the person who assigned themselves", async () => {
    const task = await must(
      t.pmA.client
        .from("tasks")
        .insert({
          org_id: t.orgA.id,
          project_id: t.project.id,
          title: "Self task",
          assignee_id: t.pmA.id,
        })
        .select()
        .single()
    )
    await t.pmA.client.from("tasks").update({ assignee_id: t.viewerA.id }).eq("id", task.id)

    const { data: mine } = await t.pmA.client
      .from("notifications")
      .select("title, link")
      .eq("user_id", t.pmA.id)
    expect(mine?.some((n) => n.link?.includes(task.project_id))).toBeFalsy()

    const { data: theirs } = await t.viewerA.client.from("notifications").select("type, link")
    expect(theirs).toEqual(
      expect.arrayContaining([{ type: "task_assigned", link: `projects/${t.project.id}` }])
    )
  })

  it("notifies the permit assignee when someone else changes its status", async () => {
    const permit = await must(
      t.adminA.client
        .from("permits")
        .insert({
          org_id: t.orgA.id,
          project_id: t.project.id,
          name: "Fire alarm",
          assignee_id: t.pmA.id,
        })
        .select()
        .single()
    )
    await t.adminA.client
      .from("permits")
      .update({ status: "corrections_required" })
      .eq("id", permit.id)
    const { data } = await t.pmA.client
      .from("notifications")
      .select("type, title")
      .eq("link", `permits/${permit.id}`)
      .order("created_at")
    expect(data?.map((n) => n.type)).toEqual(["permit_assigned", "permit_status_changed"])
    expect(data?.[1]?.title).toBe("Fire alarm is now Corrections Required")
  })

  it("lets users mark only their own notifications read, and not insert any", async () => {
    const { data: rows } = await t.pmA.client.from("notifications").select("id").limit(1)
    const id = rows![0]!.id
    const marked = await t.pmA.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .select()
    expect(marked.data).toHaveLength(1)

    const forged = await t.pmA.client
      .from("notifications")
      .update({ title: "Changed" })
      .eq("id", id)
    expect(forged.error?.code).toBe("42501")

    const other = await t.adminA.client
      .from("notifications")
      .update({ read_at: null })
      .eq("id", id)
      .select()
    expect(other.data).toEqual([])

    const insert = await t.adminA.client
      .from("notifications")
      .insert({ org_id: t.orgA.id, user_id: t.pmA.id, type: "task_overdue", title: "Fake" })
    expect(insert.error?.code).toBe("42501")
  })
})

describe("integrity", () => {
  it("rejects comments pointing at another org's records", async () => {
    const { error } = await t.adminB.client
      .from("comments")
      .insert({ org_id: t.orgB.id, entity_type: "permit", entity_id: t.permit.id, body: "Sneaky" })
    expect(error?.message).toBe("comment_entity_not_found")
  })

  it("requires correction tasks to be linked to a permit", async () => {
    const { error } = await t.pmA.client
      .from("tasks")
      .insert({ org_id: t.orgA.id, project_id: t.project.id, title: "Fix", is_correction: true })
    expect(error?.code).toBe("23514")
  })

  it("deleting a project cascades cleanly (permits, tasks, comments, activity)", async () => {
    const project = await must(
      t.adminA.client
        .from("projects")
        .insert({ org_id: t.orgA.id, name: "Doomed" })
        .select()
        .single()
    )
    const permit = await must(
      t.adminA.client
        .from("permits")
        .insert({ org_id: t.orgA.id, project_id: project.id, name: "Doomed permit" })
        .select()
        .single()
    )
    await t.adminA.client.from("tasks").insert({
      org_id: t.orgA.id,
      project_id: project.id,
      permit_id: permit.id,
      title: "Doomed task",
    })
    await t.adminA.client
      .from("comments")
      .insert({ org_id: t.orgA.id, entity_type: "permit", entity_id: permit.id, body: "Bye" })

    const { error } = await t.adminA.client.from("projects").delete().eq("id", project.id)
    expect(error).toBeNull()
    const db = admin()
    const [permits, tasks, comments, activity] = await Promise.all([
      db.from("permits").select("id").eq("project_id", project.id),
      db.from("tasks").select("id").eq("project_id", project.id),
      db.from("comments").select("id").eq("entity_id", permit.id),
      db.from("activity_log").select("id").eq("project_id", project.id),
    ])
    expect([permits.data, tasks.data, comments.data, activity.data]).toEqual([[], [], [], []])
  })

  it("removing a member unassigns their work", async () => {
    const { data: before } = await admin().from("permits").select("id").eq("assignee_id", t.pmA.id)
    expect(before?.length).toBeGreaterThan(0)
    await t.adminA.client
      .from("organization_members")
      .delete()
      .match({ org_id: t.orgA.id, user_id: t.pmA.id })
    const { data: after } = await admin().from("permits").select("id").eq("assignee_id", t.pmA.id)
    expect(after).toEqual([])
  })
})
