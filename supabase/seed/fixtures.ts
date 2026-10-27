import type { Database } from "../../src/lib/supabase/database.types"

type Enums = Database["public"]["Enums"]

/**
 * Demo data for "Cascade Ridge Builders (Demo)". Everything is fictional: people, companies,
 * addresses and jurisdictions. Day offsets are relative to the day the seed runs, so the
 * dashboard always has upcoming expirations, overdue tasks and stalled reviews.
 */

export const DEMO_ORG = { name: "Cascade Ridge Builders (Demo)", slug: "cascade-ridge-demo" }

export type UserKey = "admin" | "pm" | "pm2" | "viewer"

export const DEMO_USERS: Record<UserKey, { name: string; email: string; role: Enums["org_role"] }> =
  {
    admin: { name: "Morgan Reyes", email: "admin@cascade-ridge.example", role: "admin" },
    pm: { name: "Jamie Patel", email: "pm@cascade-ridge.example", role: "project_manager" },
    pm2: { name: "Taylor Brooks", email: "taylor@cascade-ridge.example", role: "project_manager" },
    viewer: { name: "Chris Novak", email: "viewer@cascade-ridge.example", role: "viewer" },
  }

export type ProjectFixture = {
  key: string
  name: string
  address: string
  city: string
  jurisdiction: string
  type: Enums["project_type"]
  status: Enums["project_status"]
  manager: UserKey
  startAgo: number
  targetIn: number
}

export const PROJECTS: ProjectFixture[] = [
  {
    key: "alder",
    name: "Alder Ridge Residence",
    address: "1420 Alder Ridge Rd",
    city: "Pinecrest",
    jurisdiction: "City of Pinecrest",
    type: "residential",
    status: "active",
    manager: "pm",
    startAgo: 130,
    targetIn: 240,
  },
  {
    key: "birch",
    name: "Birchwood Duplex",
    address: "88 Birchwood Ln",
    city: "Pinecrest",
    jurisdiction: "City of Pinecrest",
    type: "residential",
    status: "active",
    manager: "pm2",
    startAgo: 170,
    targetIn: 300,
  },
  {
    key: "harbor",
    name: "Harbor Street Café TI",
    address: "210 Harbor St, Suite B",
    city: "Westbrook",
    jurisdiction: "City of Westbrook",
    type: "commercial",
    status: "active",
    manager: "pm",
    startAgo: 75,
    targetIn: 90,
  },
  {
    key: "summit",
    name: "Summit Medical Office TI",
    address: "4500 Summit Pkwy, Floor 2",
    city: "Westbrook",
    jurisdiction: "City of Westbrook",
    type: "commercial",
    status: "active",
    manager: "pm2",
    startAgo: 60,
    targetIn: 150,
  },
  {
    key: "elm",
    name: "Elm Avenue Kitchen Remodel",
    address: "37 Elm Ave",
    city: "Pinecrest",
    jurisdiction: "City of Pinecrest",
    type: "renovation",
    status: "active",
    manager: "pm",
    startAgo: 40,
    targetIn: 45,
  },
  {
    key: "lake",
    name: "Lakeside Bungalow Addition",
    address: "9 Lakeview Ct",
    city: "Millbrook",
    jurisdiction: "Millbrook County",
    type: "renovation",
    status: "on_hold",
    manager: "pm2",
    startAgo: 110,
    targetIn: 200,
  },
  {
    key: "cedar",
    name: "Cedar Point Retail Shell",
    address: "1200 Cedar Point Dr",
    city: "Westbrook",
    jurisdiction: "City of Westbrook",
    type: "commercial",
    status: "completed",
    manager: "admin",
    startAgo: 520,
    targetIn: -20,
  },
]

export type PermitFixture = {
  key: string
  project: string
  name: string
  type: Enums["permit_type"]
  status: Enums["permit_status"]
  assignee: UserKey | null
  /** Days ago the application was submitted (null = never submitted). */
  submittedAgo?: number
  approvedAgo?: number
  /** Days from today until expiry; negative = already past. */
  expiresIn?: number
  /** Days ago the status last changed. Defaults to the latest event. */
  changedAgo?: number
  notes?: string
}

export const PERMITS: PermitFixture[] = [
  {
    key: "alder-bld",
    project: "alder",
    name: "Building permit – new single-family residence",
    type: "building",
    status: "approved",
    assignee: "pm",
    submittedAgo: 95,
    approvedAgo: 40,
    expiresIn: 320,
    notes: "Final plan set stamped. Keep the inspection card on site.",
  },
  {
    key: "alder-elec",
    project: "alder",
    name: "Electrical service upgrade (400A)",
    type: "electrical",
    status: "under_review",
    assignee: "pm2",
    submittedAgo: 50,
    changedAgo: 45,
    notes: "Reviewer assigned. No response since the intake call.",
  },
  {
    key: "alder-plmb",
    project: "alder",
    name: "Plumbing rough-in",
    type: "plumbing",
    status: "submitted",
    assignee: "pm",
    submittedAgo: 6,
  },
  {
    key: "alder-grade",
    project: "alder",
    name: "Grading and drainage",
    type: "grading",
    status: "approved",
    assignee: "pm",
    submittedAgo: 120,
    approvedAgo: 80,
    expiresIn: 12,
    notes: "Expires before rough grading is finished. Request an extension or schedule the final.",
  },
  {
    key: "alder-mech",
    project: "alder",
    name: "Mechanical – HVAC",
    type: "mechanical",
    status: "draft",
    assignee: "pm",
  },

  {
    key: "birch-bld",
    project: "birch",
    name: "Building permit – duplex",
    type: "building",
    status: "corrections_required",
    assignee: "pm2",
    submittedAgo: 30,
    changedAgo: 4,
    notes: "Second-round comments: egress window sizes and shear wall nailing schedule.",
  },
  {
    key: "birch-demo",
    project: "birch",
    name: "Demolition – detached garage",
    type: "demolition",
    status: "closed",
    assignee: "pm2",
    submittedAgo: 150,
    approvedAgo: 130,
    expiresIn: -20,
    changedAgo: 60,
  },
  {
    key: "birch-elec",
    project: "birch",
    name: "Electrical",
    type: "electrical",
    status: "draft",
    assignee: "pm2",
  },
  {
    key: "birch-plmb",
    project: "birch",
    name: "Plumbing",
    type: "plumbing",
    status: "under_review",
    assignee: "pm2",
    submittedAgo: 20,
    changedAgo: 12,
  },

  {
    key: "harbor-ti",
    project: "harbor",
    name: "Tenant improvement – building",
    type: "building",
    status: "approved",
    assignee: "pm",
    submittedAgo: 60,
    approvedAgo: 21,
    expiresIn: 25,
  },
  {
    key: "harbor-sign",
    project: "harbor",
    name: "Signage – storefront blade sign",
    type: "signage",
    status: "rejected",
    assignee: "pm",
    submittedAgo: 40,
    changedAgo: 18,
    notes: "Rejected: projects 6 in. past the allowed encroachment. Redesign and resubmit.",
  },
  {
    key: "harbor-fire",
    project: "harbor",
    name: "Fire sprinkler modification",
    type: "fire",
    status: "corrections_required",
    assignee: "pm",
    submittedAgo: 25,
    changedAgo: 2,
    notes: "Fire marshal wants revised hydraulic calcs for the new kitchen layout.",
  },
  {
    key: "harbor-mech",
    project: "harbor",
    name: "Mechanical – kitchen hood",
    type: "mechanical",
    status: "under_review",
    assignee: "pm",
    submittedAgo: 14,
    changedAgo: 9,
  },
  {
    key: "harbor-health",
    project: "harbor",
    name: "Food service plan review",
    type: "other",
    status: "submitted",
    assignee: "pm",
    submittedAgo: 3,
  },

  {
    key: "summit-bld",
    project: "summit",
    name: "Building – medical office TI",
    type: "building",
    status: "under_review",
    assignee: "pm2",
    submittedAgo: 38,
    changedAgo: 36,
  },
  {
    key: "summit-elec",
    project: "summit",
    name: "Electrical – imaging suite",
    type: "electrical",
    status: "approved",
    assignee: "pm2",
    submittedAgo: 50,
    approvedAgo: 10,
    expiresIn: 5,
    notes: "Short-term approval. Must pass rough inspection before it lapses.",
  },
  {
    key: "summit-fire",
    project: "summit",
    name: "Fire alarm",
    type: "fire",
    status: "submitted",
    assignee: "pm2",
    submittedAgo: 2,
  },
  {
    key: "summit-plmb",
    project: "summit",
    name: "Plumbing – medical gas",
    type: "plumbing",
    status: "draft",
    assignee: "pm2",
  },

  {
    key: "elm-bld",
    project: "elm",
    name: "Building – kitchen remodel",
    type: "building",
    status: "approved",
    assignee: "pm",
    submittedAgo: 30,
    approvedAgo: 14,
    expiresIn: 170,
  },
  {
    key: "elm-elec",
    project: "elm",
    name: "Electrical – kitchen circuits",
    type: "electrical",
    status: "approved",
    assignee: "pm",
    submittedAgo: 28,
    approvedAgo: 12,
    expiresIn: 40,
  },
  {
    key: "elm-plmb",
    project: "elm",
    name: "Plumbing – fixture relocation",
    type: "plumbing",
    status: "corrections_required",
    assignee: "pm",
    submittedAgo: 18,
    changedAgo: 6,
  },
  {
    key: "elm-mech",
    project: "elm",
    name: "Mechanical – range hood duct",
    type: "mechanical",
    status: "expired",
    assignee: "pm",
    submittedAgo: 400,
    approvedAgo: 380,
    expiresIn: -15,
    changedAgo: 15,
    notes: "Lapsed before the work started. Needs a new application.",
  },

  {
    key: "lake-bld",
    project: "lake",
    name: "Building – rear addition",
    type: "building",
    status: "corrections_required",
    assignee: "pm2",
    submittedAgo: 70,
    changedAgo: 33,
    notes: "On hold until the owner approves the revised foundation design.",
  },
  {
    key: "lake-grade",
    project: "lake",
    name: "Grading",
    type: "grading",
    status: "approved",
    assignee: "pm2",
    submittedAgo: 100,
    approvedAgo: 70,
    expiresIn: 55,
  },
  {
    key: "lake-elec",
    project: "lake",
    name: "Electrical",
    type: "electrical",
    status: "draft",
    assignee: null,
  },

  {
    key: "cedar-bld",
    project: "cedar",
    name: "Building – retail shell",
    type: "building",
    status: "closed",
    assignee: "admin",
    submittedAgo: 400,
    approvedAgo: 350,
    expiresIn: -10,
    changedAgo: 30,
  },
  {
    key: "cedar-fire",
    project: "cedar",
    name: "Fire sprinkler",
    type: "fire",
    status: "closed",
    assignee: "admin",
    submittedAgo: 380,
    approvedAgo: 340,
    changedAgo: 35,
  },
  {
    key: "cedar-sign",
    project: "cedar",
    name: "Signage – pylon sign",
    type: "signage",
    status: "approved",
    assignee: "admin",
    submittedAgo: 60,
    approvedAgo: 45,
    expiresIn: 19,
  },
  {
    key: "cedar-grade",
    project: "cedar",
    name: "Site grading",
    type: "grading",
    status: "expired",
    assignee: "admin",
    submittedAgo: 500,
    approvedAgo: 480,
    expiresIn: -45,
    changedAgo: 45,
  },
]

export type TaskFixture = {
  project: string
  permit?: string
  title: string
  description?: string
  assignee: UserKey | null
  /** Days from today; negative = in the past. */
  dueIn?: number
  priority: Enums["task_priority"]
  status: Enums["task_status"]
  correction?: boolean
  createdAgo: number
  completedAgo?: number
}

export const TASKS: TaskFixture[] = [
  {
    project: "birch",
    permit: "birch-bld",
    title: "Resize egress windows in bedrooms 2 and 3",
    assignee: "pm2",
    dueIn: -3,
    priority: "high",
    status: "in_progress",
    correction: true,
    createdAgo: 4,
  },
  {
    project: "birch",
    permit: "birch-bld",
    title: "Add shear wall nailing schedule to S-2",
    assignee: "pm2",
    dueIn: 4,
    priority: "medium",
    status: "todo",
    correction: true,
    createdAgo: 4,
  },
  {
    project: "harbor",
    permit: "harbor-fire",
    title: "Get revised hydraulic calcs from sprinkler sub",
    assignee: "pm",
    dueIn: 2,
    priority: "urgent",
    status: "todo",
    correction: true,
    createdAgo: 2,
  },
  {
    project: "harbor",
    permit: "harbor-fire",
    title: "Mark up head locations on new kitchen layout",
    assignee: "pm",
    priority: "medium",
    status: "done",
    correction: true,
    createdAgo: 2,
    completedAgo: 1,
  },
  {
    project: "elm",
    permit: "elm-plmb",
    title: "Show cleanout location on plumbing isometric",
    assignee: "pm",
    dueIn: -1,
    priority: "high",
    status: "todo",
    correction: true,
    createdAgo: 6,
  },
  {
    project: "lake",
    permit: "lake-bld",
    title: "Revise foundation detail per geotech letter",
    assignee: "pm2",
    dueIn: -10,
    priority: "medium",
    status: "todo",
    correction: true,
    createdAgo: 33,
  },
  {
    project: "alder",
    permit: "alder-grade",
    title: "Schedule final grading inspection before permit expires",
    assignee: "pm",
    dueIn: 5,
    priority: "urgent",
    status: "todo",
    createdAgo: 3,
  },
  {
    project: "alder",
    permit: "alder-elec",
    title: "Follow up with plan reviewer on electrical service",
    description: "No movement in over a month. Ask for an ETA.",
    assignee: "pm2",
    dueIn: -2,
    priority: "high",
    status: "todo",
    createdAgo: 10,
  },
  {
    project: "alder",
    permit: "alder-mech",
    title: "Finish HVAC load calcs and submit",
    assignee: "pm",
    dueIn: 10,
    priority: "medium",
    status: "in_progress",
    createdAgo: 8,
  },
  {
    project: "alder",
    title: "Order roll-off dumpster for framing debris",
    assignee: "pm",
    priority: "low",
    status: "done",
    createdAgo: 20,
    completedAgo: 18,
  },
  {
    project: "summit",
    permit: "summit-elec",
    title: "Book rough electrical inspection",
    assignee: "pm2",
    dueIn: 3,
    priority: "urgent",
    status: "todo",
    createdAgo: 2,
  },
  {
    project: "summit",
    permit: "summit-bld",
    title: "Call city about stalled TI review",
    assignee: "pm2",
    dueIn: 1,
    priority: "high",
    status: "todo",
    createdAgo: 5,
  },
  {
    project: "harbor",
    permit: "harbor-sign",
    title: "Redesign blade sign within encroachment limit",
    assignee: "pm",
    dueIn: 7,
    priority: "medium",
    status: "todo",
    createdAgo: 17,
  },
  {
    project: "harbor",
    title: "Confirm grease interceptor size with health dept",
    assignee: "pm",
    dueIn: 9,
    priority: "medium",
    status: "todo",
    createdAgo: 3,
  },
  {
    project: "elm",
    permit: "elm-mech",
    title: "Re-apply for range hood duct permit",
    assignee: "pm",
    dueIn: -5,
    priority: "medium",
    status: "todo",
    createdAgo: 14,
  },
  {
    project: "elm",
    title: "Walk through final finishes with homeowner",
    assignee: "pm",
    dueIn: 12,
    priority: "low",
    status: "todo",
    createdAgo: 4,
  },
  {
    project: "cedar",
    permit: "cedar-bld",
    title: "Collect certificate of occupancy",
    assignee: "admin",
    priority: "high",
    status: "done",
    createdAgo: 45,
    completedAgo: 30,
  },
  {
    project: "cedar",
    permit: "cedar-sign",
    title: "Install pylon sign before approval lapses",
    assignee: "admin",
    dueIn: 14,
    priority: "medium",
    status: "todo",
    createdAgo: 20,
  },
  {
    project: "birch",
    title: "Update owner on permit timeline",
    assignee: "pm2",
    priority: "low",
    status: "todo",
    createdAgo: 2,
  },
]

export type DocumentFixture = {
  project: string
  permit?: string
  name: string
  file: string
  versions: { uploadedAgo: number; by: UserKey; lines: string[] }[]
}

export const DOCUMENTS: DocumentFixture[] = [
  {
    project: "alder",
    permit: "alder-bld",
    name: "Site plan",
    file: "site-plan.pdf",
    versions: [
      {
        uploadedAgo: 100,
        by: "pm",
        lines: ["Revision A: initial submittal", "Lot 14, Alder Ridge (fictional)"],
      },
      {
        uploadedAgo: 70,
        by: "pm",
        lines: ["Revision B: setbacks adjusted per plan review", "Lot 14, Alder Ridge (fictional)"],
      },
      {
        uploadedAgo: 42,
        by: "pm2",
        lines: ["Revision C: approved set", "Lot 14, Alder Ridge (fictional)"],
      },
    ],
  },
  {
    project: "birch",
    permit: "birch-bld",
    name: "Plan review comments – round 2",
    file: "plan-review-comments.pdf",
    versions: [
      {
        uploadedAgo: 4,
        by: "pm2",
        lines: [
          "1. Bedroom 2 and 3 egress windows below minimum",
          "2. Provide shear wall nailing schedule",
        ],
      },
    ],
  },
  {
    project: "harbor",
    permit: "harbor-fire",
    name: "Fire sprinkler shop drawings",
    file: "sprinkler-shop-drawings.pdf",
    versions: [
      { uploadedAgo: 25, by: "pm", lines: ["Sheet FP-1: head layout", "Original kitchen layout"] },
      {
        uploadedAgo: 1,
        by: "pm",
        lines: ["Sheet FP-1: head layout, revised", "Updated for the new kitchen line"],
      },
    ],
  },
  {
    project: "elm",
    permit: "elm-bld",
    name: "Approved permit card",
    file: "permit-card.pdf",
    versions: [
      {
        uploadedAgo: 13,
        by: "pm",
        lines: ["Post on site, visible from the street", "Inspections: framing, insulation, final"],
      },
    ],
  },
]

export const COMMENTS: { permit: string; by: UserKey; daysAgo: number; body: string }[] = [
  {
    permit: "birch-bld",
    by: "pm2",
    daysAgo: 4,
    body: "Reviewer flagged egress on two bedrooms. I've asked the architect for revised window specs.",
  },
  {
    permit: "birch-bld",
    by: "admin",
    daysAgo: 3,
    body: "Let's get this back in by Friday. The framing crew starts the week after.",
  },
  {
    permit: "harbor-fire",
    by: "pm",
    daysAgo: 2,
    body: "Fire marshal wants new hydraulic calcs. Sprinkler sub says two days.",
  },
  {
    permit: "alder-elec",
    by: "pm2",
    daysAgo: 12,
    body: "Still nothing from the city. The utility needs the approval before they'll schedule the service drop.",
  },
  {
    permit: "summit-elec",
    by: "pm2",
    daysAgo: 9,
    body: "Approval is only good for 15 days. We need the rough inspection booked ASAP.",
  },
  {
    permit: "alder-grade",
    by: "pm",
    daysAgo: 3,
    body: "Going to try for the final before it expires rather than paying for an extension.",
  },
]
