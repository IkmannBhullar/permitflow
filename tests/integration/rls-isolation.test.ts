import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildTenants, type Tenants } from "./fixtures"
import { admin, cleanup, TINY_PDF } from "./helpers"

let t: Tenants

beforeAll(async () => {
  t = await buildTenants()
})

afterAll(async () => {
  if (t) await cleanup([t.orgA.id, t.orgB.id], t.users)
})

describe("cross-org isolation: reads", () => {
  const tables = [
    "projects",
    "permits",
    "tasks",
    "documents",
    "document_versions",
    "comments",
    "activity_log",
    "organization_members",
  ] as const

  it.each(tables)("org B admin sees none of org A's %s", async (table) => {
    const { data, error } = await t.adminB.client.from(table).select("*").eq("org_id", t.orgA.id)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it.each(tables)("org A members do see their own %s", async (table) => {
    const { data } = await t.viewerA.client.from(table).select("*").eq("org_id", t.orgA.id)
    expect(data?.length).toBeGreaterThan(0)
  })

  it("org B admin cannot read org A's organization row", async () => {
    const { data } = await t.adminB.client.from("organizations").select("*").eq("id", t.orgA.id)
    expect(data).toEqual([])
  })

  it("org B admin cannot read org A members' profiles", async () => {
    const { data } = await t.adminB.client.from("profiles").select("*").eq("id", t.pmA.id)
    expect(data).toEqual([])
  })

  it("org B admin cannot read org A's notifications", async () => {
    const { data } = await t.adminB.client.from("notifications").select("*").eq("org_id", t.orgA.id)
    expect(data).toEqual([])
  })
})

describe("cross-org isolation: writes", () => {
  it("cannot insert a project into another org", async () => {
    const { error } = await t.adminB.client
      .from("projects")
      .insert({ org_id: t.orgA.id, name: "Intrusion" })
    expect(error?.code).toBe("42501")
  })

  it("cannot insert a permit into another org", async () => {
    const { error } = await t.adminB.client
      .from("permits")
      .insert({ org_id: t.orgA.id, project_id: t.project.id, name: "Intrusion" })
    expect(error?.code).toBe("42501")
  })

  it("cannot attach own-org rows to another org's project (composite FK)", async () => {
    const { error } = await t.adminB.client
      .from("permits")
      .insert({ org_id: t.orgB.id, project_id: t.project.id, name: "Cross-link" })
    expect(error?.code).toBe("23503")
  })

  it("cannot assign a permit to someone outside the org", async () => {
    const { error } = await t.adminB.client.from("permits").insert({
      org_id: t.orgB.id,
      project_id: t.projectB.id,
      name: "Bad assignee",
      assignee_id: t.pmA.id,
    })
    expect(error?.code).toBe("23503")
  })

  it.each(["projects", "permits", "tasks", "documents"] as const)(
    "updates to another org's %s affect no rows",
    async (table) => {
      const id = {
        projects: t.project.id,
        permits: t.permit.id,
        tasks: t.task.id,
        documents: t.document.id,
      }[table]
      const { data } = await t.adminB.client
        .from(table)
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
      expect(data).toEqual([])
    }
  )

  it.each(["projects", "permits", "tasks", "documents"] as const)(
    "deletes of another org's %s affect no rows",
    async (table) => {
      const id = {
        projects: t.project.id,
        permits: t.permit.id,
        tasks: t.task.id,
        documents: t.document.id,
      }[table]
      await t.adminB.client.from(table).delete().eq("id", id)
      const { data } = await admin().from(table).select("id").eq("id", id)
      expect(data).toHaveLength(1)
    }
  )

  it("cannot move own row into another org even when member of both", async () => {
    // pmA joins org B too; moving A's project into B must still be refused.
    await admin()
      .from("organization_members")
      .insert({ org_id: t.orgB.id, user_id: t.pmA.id, role: "admin" })
    const { error } = await t.pmA.client
      .from("projects")
      .update({ org_id: t.orgB.id })
      .eq("id", t.project.id)
    expect(error?.message).toBe("org_id_immutable")
    await admin()
      .from("organization_members")
      .delete()
      .match({ org_id: t.orgB.id, user_id: t.pmA.id })
  })
})

describe("cross-org isolation: storage", () => {
  it("org B admin cannot download org A's file", async () => {
    const { data, error } = await t.adminB.client.storage.from("documents").download(t.storagePath)
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })

  it("org B admin cannot create a signed URL for org A's file", async () => {
    const { data } = await t.adminB.client.storage
      .from("documents")
      .createSignedUrl(t.storagePath, 60)
    expect(data?.signedUrl).toBeUndefined()
  })

  it("org B admin cannot list org A's folder", async () => {
    const { data } = await t.adminB.client.storage
      .from("documents")
      .list(`${t.orgA.id}/${t.project.id}`)
    expect(data ?? []).toEqual([])
  })

  it("org B admin cannot upload into org A's prefix", async () => {
    const { error } = await t.adminB.client.storage
      .from("documents")
      .upload(`${t.orgA.id}/${t.project.id}/intrusion.pdf`, TINY_PDF, {
        contentType: "application/pdf",
      })
    expect(error).not.toBeNull()
  })

  it("org B admin cannot delete org A's file", async () => {
    await t.adminB.client.storage.from("documents").remove([t.storagePath])
    const { data } = await t.viewerA.client.storage.from("documents").download(t.storagePath)
    expect(data).not.toBeNull()
  })

  it("org A viewer can download their org's file", async () => {
    const { data, error } = await t.viewerA.client.storage.from("documents").download(t.storagePath)
    expect(error).toBeNull()
    expect(data?.size).toBe(TINY_PDF.size)
  })

  it("rejects disallowed file types at the bucket", async () => {
    const { error } = await t.pmA.client.storage
      .from("documents")
      .upload(
        `${t.orgA.id}/${t.project.id}/x/v1/run.sh`,
        new Blob(["echo hi"], { type: "application/x-sh" }),
        {
          contentType: "application/x-sh",
        }
      )
    expect(error).not.toBeNull()
  })
})
