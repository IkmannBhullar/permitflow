import { describe, expect, it } from "vitest"

import { addDaysISO, daysBetween, relativeDays, todayISO } from "./dates"

describe("dates", () => {
  it("uses the UTC calendar day", () => {
    expect(todayISO(new Date("2026-03-01T23:30:00-08:00"))).toBe("2026-03-02")
  })

  it("adds days across month boundaries", () => {
    expect(addDaysISO("2026-01-30", 3)).toBe("2026-02-02")
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28")
  })

  it("counts calendar days", () => {
    expect(daysBetween("2026-10-01", "2026-10-31")).toBe(30)
    expect(daysBetween("2026-10-31", "2026-10-01")).toBe(-30)
  })

  it("describes relative days", () => {
    expect(relativeDays("2026-10-26", "2026-10-26")).toBe("today")
    expect(relativeDays("2026-10-29", "2026-10-26")).toBe("in 3 days")
    expect(relativeDays("2026-10-20", "2026-10-26")).toBe("6 days ago")
  })
})
