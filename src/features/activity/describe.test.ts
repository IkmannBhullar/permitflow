import { describe, expect, it } from "vitest"

import { activityHref, describeActivity } from "./describe"

const names: Record<string, string> = { u1: "Maya Chen" }
const nameOf = (id: string) => names[id] ?? "someone"

describe("describeActivity", () => {
  it("describes permit status changes with labels", () => {
    expect(
      describeActivity(
        {
          action: "status_changed",
          entity_type: "permit",
          metadata: { name: "Electrical", from: "under_review", to: "corrections_required" },
        },
        nameOf
      )
    ).toBe("changed permit Electrical from Under review to Corrections required")
  })

  it("names assignees and handles unassignment", () => {
    expect(
      describeActivity(
        { action: "assigned", entity_type: "permit", metadata: { name: "Fire", to: "u1" } },
        nameOf
      )
    ).toBe("assigned permit Fire to Maya Chen")
    expect(
      describeActivity(
        { action: "assigned", entity_type: "task", metadata: { title: "Call city", to: null } },
        nameOf
      )
    ).toBe("unassigned task Call city")
  })

  it("lists updated fields in plain words", () => {
    expect(
      describeActivity(
        {
          action: "updated",
          entity_type: "permit",
          metadata: { name: "Grading", fields: ["expires_at", "notes"] },
        },
        nameOf
      )
    ).toBe("updated the expiration date and notes of permit Grading")
  })

  it("mentions document versions after the first", () => {
    expect(
      describeActivity(
        {
          action: "uploaded",
          entity_type: "document",
          metadata: { name: "Plans.pdf", version: 2 },
        },
        nameOf
      )
    ).toBe("uploaded version 2 of Plans.pdf")
  })
})

describe("activityHref", () => {
  it("links tasks to their permit when they have one", () => {
    expect(
      activityHref({
        action: "created",
        entity_type: "task",
        entity_id: "t1",
        project_id: "p1",
        metadata: { permit_id: "pm1" },
      })
    ).toBe("permits/pm1")
  })

  it("links deleted records to their project", () => {
    expect(
      activityHref({
        action: "deleted",
        entity_type: "permit",
        entity_id: "x",
        project_id: "p1",
        metadata: {},
      })
    ).toBe("projects/p1")
  })
})
