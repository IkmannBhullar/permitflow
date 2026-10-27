import { describe, expect, it } from "vitest"

import { parsePermitFilters, searchPattern } from "./filters"

describe("parsePermitFilters", () => {
  it("applies defaults", () => {
    expect(parsePermitFilters({})).toMatchObject({
      q: "",
      statuses: [],
      type: null,
      expiringDays: null,
      sort: "updated_at",
      dir: "desc",
      page: 1,
    })
  })

  it("parses a dashboard deep link", () => {
    const f = parsePermitFilters({
      status: "submitted,under_review",
      expiring: "30",
      sort: "expires_at",
      dir: "asc",
    })
    expect(f.statuses).toEqual(["submitted", "under_review"])
    expect(f.expiringDays).toBe(30)
    expect(f.sort).toBe("expires_at")
    expect(f.dir).toBe("asc")
  })

  it("drops invalid values instead of passing them to the database", () => {
    const f = parsePermitFilters({
      status: "approved,hacked",
      type: "nuclear",
      project: "not-a-uuid",
      sort: "org_id;drop",
      page: "-3",
      expiring: "99999",
    })
    expect(f.statuses).toEqual(["approved"])
    expect(f.type).toBeNull()
    expect(f.projectId).toBeNull()
    expect(f.sort).toBe("updated_at")
    expect(f.page).toBe(1)
    expect(f.expiringDays).toBeNull()
  })

  it("recognizes the unassigned filter", () => {
    expect(parsePermitFilters({ assignee: "unassigned" })).toMatchObject({
      unassigned: true,
      assigneeId: null,
    })
  })
})

describe("searchPattern", () => {
  it("escapes wildcards and strips filter syntax", () => {
    expect(searchPattern("50%_off,(x)")).toBe("%50\\%\\_off  x %")
  })
})
