import { describe, expect, it } from "vitest"

import { projectSchema } from "./schemas"

const valid = {
  name: "Maple Street Duplex",
  address: "",
  city: "",
  jurisdiction: "",
  project_type: "residential",
  status: "active",
  manager_id: null,
  start_date: "2026-05-01",
  target_completion_date: "2026-12-01",
} as const

describe("projectSchema", () => {
  it("accepts a minimal project", () => {
    expect(projectSchema.safeParse(valid).success).toBe(true)
  })

  it("trims names and rejects blanks", () => {
    expect(projectSchema.safeParse({ ...valid, name: "   " }).success).toBe(false)
    expect(projectSchema.parse({ ...valid, name: "  Duplex " }).name).toBe("Duplex")
  })

  it("rejects a target date before the start date", () => {
    const result = projectSchema.safeParse({ ...valid, target_completion_date: "2026-01-01" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["target_completion_date"])
  })

  it("does not allow archiving through the form", () => {
    expect(projectSchema.safeParse({ ...valid, status: "archived" }).success).toBe(false)
  })
})
