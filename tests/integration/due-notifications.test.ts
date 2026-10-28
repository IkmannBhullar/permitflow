import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { buildTenants, must, type Tenants } from "./fixtures"
import { admin, cleanup } from "./helpers"

vi.mock("server-only", () => ({}))
const { generateDueNotifications } = await import("@/features/notifications/generate")

let t: Tenants
const today = new Date().toISOString().slice(0, 10)
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

beforeAll(async () => {
  t = await buildTenants()
  await must(
    t.pmA.client
      .from("permits")
      .insert({
        org_id: t.orgA.id,
        project_id: t.project.id,
        name: "Expiring soon",
        status: "approved",
        approved_at: today,
        expires_at: inDays(5),
        assignee_id: t.pmA.id,
      })
      .select()
      .single()
  )
  await must(
    t.pmA.client
      .from("tasks")
      .insert({
        org_id: t.orgA.id,
        project_id: t.project.id,
        title: "Late task",
        due_date: inDays(-2),
        assignee_id: t.viewerA.id,
      })
      .select()
      .single()
  )
})

afterAll(async () => {
  if (t) await cleanup([t.orgA.id, t.orgB.id], t.users)
})

describe("generateDueNotifications", () => {
  it("creates reminders once and is idempotent on re-run", async () => {
    const first = await generateDueNotifications(admin(), { orgId: t.orgA.id })
    expect(first.created).toBeGreaterThanOrEqual(2)
    const second = await generateDueNotifications(admin(), { orgId: t.orgA.id })
    expect(second).toEqual({ candidates: first.candidates, created: 0 })

    const { data: pm } = await t.pmA.client
      .from("notifications")
      .select("type, title")
      .eq("type", "permit_expiring")
    expect(pm).toEqual([{ type: "permit_expiring", title: "Expiring soon expires in 5 days" }])
    const { data: viewer } = await t.viewerA.client
      .from("notifications")
      .select("type")
      .eq("type", "task_overdue")
    expect(viewer).toHaveLength(1)
  })

  it("only touches the requested org", async () => {
    const { data } = await admin()
      .from("notifications")
      .select("id")
      .eq("org_id", t.orgB.id)
      .in("type", ["permit_expiring", "task_overdue"])
    expect(data).toEqual([])
  })
})
