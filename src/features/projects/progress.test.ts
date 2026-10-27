import { describe, expect, it } from "vitest"

import { projectProgress } from "./progress"

describe("projectProgress", () => {
  it("is zero with no permits", () => {
    expect(projectProgress([])).toEqual({ done: 0, total: 0, percent: 0 })
  })

  it("counts approved and closed as done", () => {
    expect(projectProgress(["approved", "closed", "submitted", "draft"])).toEqual({
      done: 2,
      total: 4,
      percent: 50,
    })
  })

  it("rounds to a whole percent", () => {
    expect(projectProgress(["approved", "draft", "draft"]).percent).toBe(33)
  })
})
