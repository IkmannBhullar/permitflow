import { describe, expect, it } from "vitest"

import { buildReport, parseReportParams, type ReportData, type ReportPermit } from "./definitions"

const today = "2026-10-28"
const names = { u1: "Jamie Patel" }
const project = { id: "pr1", name: "Alder Ridge" }

const permit = (id: string, overrides: Partial<ReportPermit>): ReportPermit => ({
  id,
  name: `Permit ${id}`,
  status: "draft",
  permit_type: "building",
  application_number: null,
  jurisdiction: "City of Pinecrest",
  submitted_at: null,
  expires_at: null,
  status_changed_at: `${today}T10:00:00Z`,
  assignee_id: "u1",
  project,
  ...overrides,
})

const data: ReportData = {
  projects: [
    { id: "pr1", name: "Alder Ridge", status: "active", city: "Pinecrest", manager_id: "u1" },
    { id: "pr2", name: "Old Job", status: "archived", city: "", manager_id: null },
  ],
  permits: [
    permit("a", { status: "submitted", submitted_at: "2026-10-18" }),
    permit("b", { status: "under_review", submitted_at: "2026-09-28" }),
    permit("c", { status: "approved", expires_at: "2026-11-02" }),
    permit("d", { status: "corrections_required", status_changed_at: "2026-10-20T09:00:00Z" }),
    permit("e", { status: "closed", expires_at: "2026-11-01" }),
    permit("f", { status: "approved", expires_at: "2027-03-01" }),
  ],
  tasks: [
    {
      id: "t1",
      title: "Fix egress",
      status: "todo",
      due_date: "2026-10-25",
      is_correction: true,
      permit_id: "d",
      assignee_id: "u1",
    },
    {
      id: "t2",
      title: "Done fix",
      status: "done",
      due_date: null,
      is_correction: true,
      permit_id: "d",
      assignee_id: null,
    },
  ],
}

describe("buildReport", () => {
  it("summarizes permits per active project", () => {
    const r = buildReport("project-summary", data, { today, names })
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]).toMatchObject({
      project: "Alder Ridge",
      manager: "Jamie Patel",
      total: 6,
      pending: 2,
      corrections: 1,
      approved: 2,
      closed: 1,
      progress: "50%",
      next_expiry: "2026-11-02",
    })
  })

  it("lists pending permits longest-waiting first", () => {
    const r = buildReport("pending", data, { today, names })
    expect(r.rows.map((x) => [x.permit, x.days_waiting])).toEqual([
      ["Permit b", 30],
      ["Permit a", 10],
    ])
  })

  it("lists permits expiring within the window, ignoring closed ones", () => {
    expect(
      buildReport("expiring", data, { today, names, days: 7 }).rows.map((x) => x.permit)
    ).toEqual(["Permit c"])
    expect(buildReport("expiring", data, { today, names, days: 90 }).summary).toBe(
      "1 permit expiring in the next 90 days."
    )
  })

  it("shows outstanding corrections with open and overdue task counts", () => {
    const [row] = buildReport("corrections", data, { today, names }).rows
    expect(row).toMatchObject({
      permit: "Permit d",
      days_waiting: 8,
      open_tasks: 1,
      overdue_tasks: 1,
      tasks: "Fix egress (Jamie Patel)",
    })
  })
})

describe("parseReportParams", () => {
  it("accepts only the offered windows", () => {
    expect(parseReportParams({ days: "14" }).days).toBe(14)
    expect(parseReportParams({ days: "9999" }).days).toBe(30)
    expect(parseReportParams({}).days).toBe(30)
  })
})
