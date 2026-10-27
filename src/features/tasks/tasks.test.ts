import { describe, expect, it } from "vitest"

import { isOverdue } from "./constants"
import { taskSchema } from "./schemas"

const base = {
  project_id: "6f9c1b2a-3d4e-4f50-8a6b-7c8d9e0f1a2b",
  permit_id: null,
  title: "Revise site plan",
  description: "",
  assignee_id: null,
  due_date: null,
  priority: "high",
  status: "todo",
  is_correction: false,
} as const

describe("taskSchema", () => {
  it("accepts a plain task", () => {
    expect(taskSchema.safeParse(base).success).toBe(true)
  })

  it("requires a permit for correction tasks", () => {
    const r = taskSchema.safeParse({ ...base, is_correction: true })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.path).toEqual(["permit_id"])
  })
})

describe("isOverdue", () => {
  it("flags open tasks due before today", () => {
    expect(isOverdue({ status: "todo", due_date: "2026-10-25" }, "2026-10-26")).toBe(true)
  })

  it("ignores done tasks, tasks due today and undated tasks", () => {
    expect(isOverdue({ status: "done", due_date: "2026-10-01" }, "2026-10-26")).toBe(false)
    expect(isOverdue({ status: "in_progress", due_date: "2026-10-26" }, "2026-10-26")).toBe(false)
    expect(isOverdue({ status: "todo", due_date: null }, "2026-10-26")).toBe(false)
  })
})
