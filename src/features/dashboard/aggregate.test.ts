import { describe, expect, it } from "vitest"

import {
  computeStats,
  expiringByWeek,
  needsAttention,
  permitsByStatus,
  upcomingDeadlines,
  type DashPermit,
  type DashTask,
} from "./aggregate"

const today = "2026-10-26"
const project = { id: "p1", name: "Maple Duplex" }

function permit(id: string, overrides: Partial<DashPermit> = {}): DashPermit {
  return {
    id,
    name: `Permit ${id}`,
    status: "draft",
    expires_at: null,
    status_changed_at: `${today}T12:00:00Z`,
    project,
    ...overrides,
  }
}

function task(id: string, overrides: Partial<DashTask> = {}): DashTask {
  return {
    id,
    title: `Task ${id}`,
    status: "todo",
    due_date: null,
    is_correction: false,
    permit_id: null,
    project_id: "p1",
    ...overrides,
  }
}

const permits: DashPermit[] = [
  permit("a", { status: "submitted" }),
  permit("b", { status: "under_review", status_changed_at: "2026-09-01T00:00:00Z" }),
  permit("c", { status: "approved", expires_at: "2026-11-05" }),
  permit("d", { status: "corrections_required" }),
  permit("e", { status: "approved", expires_at: "2027-06-01" }),
  permit("f", { status: "closed", expires_at: "2026-10-30" }),
  permit("g", { status: "approved", expires_at: "2026-10-26" }),
]
const tasks: DashTask[] = [
  task("t1", { due_date: "2026-10-20", is_correction: true, permit_id: "d" }),
  task("t2", { due_date: "2026-10-20", status: "done" }),
  task("t3", { due_date: "2026-11-02" }),
]

describe("computeStats", () => {
  it("counts each dashboard number from the rows", () => {
    expect(computeStats(permits, tasks, 3, today)).toEqual({
      activeProjects: 3,
      totalPermits: 7,
      pending: 2,
      approved: 3,
      correctionsRequired: 1,
      expiringSoon: 2, // c (10 days) and g (today); f is closed, e is beyond 30 days
      overdueTasks: 1,
    })
  })

  it("is all zeros for an empty org", () => {
    expect(computeStats([], [], 0, today)).toEqual({
      activeProjects: 0,
      totalPermits: 0,
      pending: 0,
      approved: 0,
      correctionsRequired: 0,
      expiringSoon: 0,
      overdueTasks: 0,
    })
  })
})

describe("charts", () => {
  it("covers every status in a stable order", () => {
    const series = permitsByStatus(permits)
    expect(series.map((s) => s.status)).toEqual([
      "draft",
      "submitted",
      "under_review",
      "corrections_required",
      "approved",
      "rejected",
      "expired",
      "closed",
    ])
    expect(series.find((s) => s.status === "approved")?.count).toBe(3)
  })

  it("buckets expirations into weeks starting today", () => {
    const weeks = expiringByWeek(permits, today)
    expect(weeks).toHaveLength(8)
    expect(weeks[0]).toMatchObject({ start: "2026-10-26", end: "2026-11-01", count: 1 }) // g
    expect(weeks[1]).toMatchObject({ start: "2026-11-02", count: 1 }) // c
    expect(weeks.reduce((n, w) => n + w.count, 0)).toBe(2)
  })
})

describe("needsAttention", () => {
  it("lists corrections, expiring, overdue and stalled permits, most urgent first", () => {
    const items = needsAttention(permits, tasks, today)
    expect(items.map((i) => `${i.kind}:${i.id}`)).toEqual([
      "corrections:d",
      "expiring:g",
      "expiring:c",
      "overdue_task:t1",
      "stalled:b",
    ])
    expect(items.find((i) => i.kind === "overdue_task")?.href).toBe("permits/d")
    expect(items.find((i) => i.kind === "stalled")?.detail).toMatch(/55 days/)
  })
})

describe("upcomingDeadlines", () => {
  it("merges permit expirations and task due dates within two weeks", () => {
    expect(
      upcomingDeadlines(permits, tasks, today).map((d) => `${d.kind}:${d.id}:${d.date}`)
    ).toEqual([
      "permit_expires:g:2026-10-26",
      "task_due:t3:2026-11-02",
      "permit_expires:c:2026-11-05",
    ])
  })
})
