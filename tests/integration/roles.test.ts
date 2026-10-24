import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildTenants, must, type Tenants } from "./fixtures"
import { admin, cleanup, hashToken, newToken, TINY_PDF } from "./helpers"

let t: Tenants

beforeAll(async () => {
  t = await buildTenants()
})

afterAll(async () => {
  if (t) await cleanup([t.orgA.id, t.orgB.id], t.users)
})

describe("viewer is read-only", () => {
  it("cannot create projects, permits, tasks, documents or comments", async () => {
    const v = t.viewerA.client
    const org_id = t.orgA.id
    const results = await Promise.all([
      v.from("projects").insert({ org_id, name: "Nope" }),
      v.from("permits").insert({ org_id, project_id: t.project.id, name: "Nope" }),
      v.from("tasks").insert({ org_id, project_id: t.project.id, title: "Nope" }),
      v.from("documents").insert({ org_id, project_id: t.project.id, name: "Nope" }),
      v
        .from("comments")
        .insert({ org_id, entity_type: "permit", entity_id: t.permit.id, body: "Nope" }),
    ])
    for (const { error } of results) expect(error?.code).toBe("42501")
  })

  it("cannot update or delete anything", async () => {
    const v = t.viewerA.client
    const updates = await Promise.all([
      v.from("projects").update({ name: "Hacked" }).eq("id", t.project.id).select(),
      v.from("permits").update({ status: "closed" }).eq("id", t.permit.id).select(),
      v.from("tasks").update({ status: "done" }).eq("id", t.task.id).select(),
      v.from("documents").update({ name: "Hacked" }).eq("id", t.document.id).select(),
      v.from("organizations").update({ name: "Hacked" }).eq("id", t.orgA.id).select(),
      v.from("organization_members").update({ role: "admin" }).eq("user_id", t.viewerA.id).select(),
    ])
    for (const { data } of updates) expect(data ?? []).toEqual([])

    await v.from("permits").delete().eq("id", t.permit.id)
    const { data: still } = await admin()
      .from("permits")
      .select("id, status")
      .eq("id", t.permit.id)
      .single()
    expect(still?.status).toBe("draft")

    const { data: role } = await admin()
      .from("organization_members")
      .select("role")
      .match({ org_id: t.orgA.id, user_id: t.viewerA.id })
      .single()
    expect(role?.role).toBe("viewer")
  })

  it("cannot upload files", async () => {
    const { error } = await t.viewerA.client.storage
      .from("documents")
      .upload(`${t.orgA.id}/${t.project.id}/v/v1/x.pdf`, TINY_PDF, {
        contentType: "application/pdf",
      })
    expect(error).not.toBeNull()
  })

  it("cannot see invites", async () => {
    const { data } = await t.viewerA.client.from("invites").select("*").eq("org_id", t.orgA.id)
    expect(data).toEqual([])
  })
})

describe("project manager", () => {
  it("can create and edit org content", async () => {
    const p = await must(
      t.pmA.client
        .from("projects")
        .insert({ org_id: t.orgA.id, name: "PM project" })
        .select()
        .single()
    )
    const { data } = await t.pmA.client
      .from("projects")
      .update({ city: "Riverton" })
      .eq("id", p.id)
      .select()
    expect(data?.[0]?.city).toBe("Riverton")
  })

  it("cannot change member roles or remove members", async () => {
    const { data: updated } = await t.pmA.client
      .from("organization_members")
      .update({ role: "admin" })
      .match({ org_id: t.orgA.id, user_id: t.pmA.id })
      .select()
    expect(updated).toEqual([])

    await t.pmA.client
      .from("organization_members")
      .delete()
      .match({ org_id: t.orgA.id, user_id: t.viewerA.id })
    const { data: members } = await admin()
      .from("organization_members")
      .select("user_id")
      .eq("org_id", t.orgA.id)
    expect(members).toHaveLength(3)
  })

  it("cannot create invites", async () => {
    const { error } = await t.pmA.client.from("invites").insert({
      org_id: t.orgA.id,
      email: "someone@example.com",
      role: "admin",
      token_hash: hashToken(newToken()),
    })
    expect(error?.code).toBe("42501")
  })

  it("cannot rename the org", async () => {
    const { data } = await t.pmA.client
      .from("organizations")
      .update({ name: "PM Org" })
      .eq("id", t.orgA.id)
      .select()
    expect(data).toEqual([])
  })

  it("cannot delete permits (admin only)", async () => {
    await t.pmA.client.from("permits").delete().eq("id", t.permit.id)
    const { data } = await admin().from("permits").select("id").eq("id", t.permit.id)
    expect(data).toHaveLength(1)
  })

  it("cannot forge authorship", async () => {
    const p = await must(
      t.pmA.client
        .from("projects")
        .insert({ org_id: t.orgA.id, name: "Forged", created_by: t.adminA.id })
        .select()
        .single()
    )
    expect(p.created_by).toBe(t.pmA.id)
  })
})

describe("admin", () => {
  it("can change roles", async () => {
    const { data } = await t.adminA.client
      .from("organization_members")
      .update({ role: "project_manager" })
      .match({ org_id: t.orgA.id, user_id: t.viewerA.id })
      .select()
    expect(data?.[0]?.role).toBe("project_manager")
    await t.adminA.client
      .from("organization_members")
      .update({ role: "viewer" })
      .match({ org_id: t.orgA.id, user_id: t.viewerA.id })
  })

  it("cannot demote or remove the last admin", async () => {
    const demote = await t.adminA.client
      .from("organization_members")
      .update({ role: "viewer" })
      .match({ org_id: t.orgA.id, user_id: t.adminA.id })
    expect(demote.error?.message).toBe("last_admin")

    const remove = await t.adminA.client
      .from("organization_members")
      .delete()
      .match({ org_id: t.orgA.id, user_id: t.adminA.id })
    expect(remove.error?.message).toBe("last_admin")
  })

  it("can rename the org but not change protected columns", async () => {
    const { data } = await t.adminA.client
      .from("organizations")
      .update({ name: "Org A Renamed" })
      .eq("id", t.orgA.id)
      .select()
    expect(data?.[0]?.name).toBe("Org A Renamed")
    const { error } = await t.adminA.client
      .from("organizations")
      .update({ is_demo: true })
      .eq("id", t.orgA.id)
    expect(error?.code).toBe("42501")
  })
})

describe("logged-out visitors", () => {
  it("see no tenant data", async () => {
    const { createClient } = await import("@supabase/supabase-js")
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await anon.from("projects").select("*")
    expect(data ?? []).toEqual([])
  })
})
