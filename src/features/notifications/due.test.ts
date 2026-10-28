import { describe, expect, it } from "vitest"

import { computeDueNotifications, expiryThreshold, type DuePermit, type DueTask } from "./due"

const today = "2026-10-28"
const project = { name: "Alder Ridge", manager_id: "manager" }

const permit = (overrides: Partial<DuePermit>): DuePermit => ({
  id: "p1",
  org_id: "org",
  name: "Grading",
  status: "approved",
  expires_at: null,
  assignee_id: "assignee",
  project,
  ...overrides,
})

const task = (overrides: Partial<DueTask>): DueTask => ({
  id: "t1",
  org_id: "org",
  title: "Call the city",
  status: "todo",
  due_date: null,
  assignee_id: "assignee",
  permit_id: null,
  project_id: "proj",
  ...overrides,
})

describe("expiryThreshold", () => {
  it.each([
    [45, null],
    [30, 30],
    [20, 30],
    [14, 14],
    [8, 14],
    [7, 7],
    [0, 7],
    [-1, null],
  ])("%i days left -> %s", (days, expected) => {
    expect(expiryThreshold(days)).toBe(expected)
  })
})

describe("computeDueNotifications", () => {
  it("warns the assignee once per threshold, keyed by permit, threshold and date", () => {
    const [n] = computeDueNotifications([permit({ expires_at: "2026-11-07" })], [], today)
    expect(n).toMatchObject({
      user_id: "assignee",
      type: "permit_expiring",
      title: "Grading expires in 10 days",
      link: "permits/p1",
      dedupe_key: "permit_expiring:p1:14d:2026-11-07",
    })
  })

  it("produces the same key on every run within a threshold window (idempotent)", () => {
    const day1 = computeDueNotifications([permit({ expires_at: "2026-11-07" })], [], "2026-10-28")
    const day2 = computeDueNotifications([permit({ expires_at: "2026-11-07" })], [], "2026-10-29")
    expect(day1[0]!.dedupe_key).toBe(day2[0]!.dedupe_key)
    const day4 = computeDueNotifications([permit({ expires_at: "2026-11-07" })], [], "2026-10-31")
    expect(day4[0]!.dedupe_key).toBe("permit_expiring:p1:7d:2026-11-07")
  })

  it("re-arms when the expiration date changes", () => {
    const before = computeDueNotifications([permit({ expires_at: "2026-11-07" })], [], today)
    const after = computeDueNotifications([permit({ expires_at: "2026-11-08" })], [], today)
    expect(before[0]!.dedupe_key).not.toBe(after[0]!.dedupe_key)
  })

  it("falls back to the project manager and skips permits nobody owns", () => {
    expect(
      computeDueNotifications(
        [permit({ expires_at: "2026-11-01", assignee_id: null })],
        [],
        today
      )[0]?.user_id
    ).toBe("manager")
    expect(
      computeDueNotifications(
        [
          permit({
            expires_at: "2026-11-01",
            assignee_id: null,
            project: { name: "X", manager_id: null },
          }),
        ],
        [],
        today
      )
    ).toEqual([])
  })

  it("ignores far-off, already-expired and closed permits", () => {
    expect(
      computeDueNotifications(
        [
          permit({ id: "far", expires_at: "2027-01-01" }),
          permit({ id: "past", expires_at: "2026-10-01" }),
          permit({ id: "closed", status: "closed", expires_at: "2026-11-01" }),
        ],
        [],
        today
      )
    ).toEqual([])
  })

  it("notifies assignees of overdue open tasks, keyed by due date", () => {
    const result = computeDueNotifications(
      [],
      [
        task({ id: "late", due_date: "2026-10-25", permit_id: "p9" }),
        task({ id: "today", due_date: "2026-10-28" }),
        task({ id: "done", due_date: "2026-10-01", status: "done" }),
        task({ id: "nobody", due_date: "2026-10-01", assignee_id: null }),
      ],
      today
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      link: "permits/p9",
      dedupe_key: "task_overdue:late:2026-10-25",
      title: "Overdue: Call the city",
    })
  })
})
