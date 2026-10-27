import { describe, expect, it } from "vitest"

import { changeStatusSchema, createPermitSchema } from "./schemas"
import { buildStatusPatch } from "./transitions"

const id = "6f9c1b2a-3d4e-4f50-8a6b-7c8d9e0f1a2b"

describe("buildStatusPatch", () => {
  it("requires a date to approve", () => {
    expect(buildStatusPatch("under_review", { status: "approved" })).toEqual({
      ok: false,
      error: expect.stringMatching(/approval date/),
    })
  })

  it("approves with the given date", () => {
    expect(
      buildStatusPatch("under_review", { status: "approved", approved_at: "2026-10-20" })
    ).toEqual({
      ok: true,
      patch: { status: "approved", approved_at: "2026-10-20" },
    })
  })

  it("lets an approved permit's date be corrected", () => {
    expect(buildStatusPatch("approved", { status: "approved", approved_at: "2026-10-01" }).ok).toBe(
      true
    )
  })

  it("rejects no-op changes", () => {
    expect(buildStatusPatch("draft", { status: "draft" }).ok).toBe(false)
  })

  it("does not touch dates for other transitions", () => {
    expect(buildStatusPatch("submitted", { status: "corrections_required" })).toEqual({
      ok: true,
      patch: { status: "corrections_required" },
    })
  })
})

describe("permit schemas enforce the approval-date rule", () => {
  it("rejects approving without a date on status change", () => {
    const r = changeStatusSchema.safeParse({ id, status: "approved", approved_at: null })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.path).toEqual(["approved_at"])
  })

  it("rejects creating an approved permit without a date", () => {
    const r = createPermitSchema.safeParse({
      project_id: id,
      name: "Building",
      permit_type: "building",
      jurisdiction: "",
      application_number: "",
      assignee_id: null,
      submitted_at: null,
      expires_at: null,
      notes: "",
      status: "approved",
      approved_at: null,
    })
    expect(r.success).toBe(false)
  })
})
