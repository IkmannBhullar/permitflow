import type { Database } from "@/lib/supabase/database.types"

export type PermitStatus = Database["public"]["Enums"]["permit_status"]
export type PermitType = Database["public"]["Enums"]["permit_type"]

/**
 * The single source of truth for how each permit status looks and reads.
 * `token` names a CSS custom property defined in globals.css, shared by badges and charts.
 */
export const PERMIT_STATUS_META: Record<
  PermitStatus,
  { label: string; description: string; token: string }
> = {
  draft: {
    label: "Draft",
    description: "Being prepared; not yet submitted.",
    token: "--status-draft",
  },
  submitted: {
    label: "Submitted",
    description: "Filed with the jurisdiction.",
    token: "--status-submitted",
  },
  under_review: {
    label: "Under review",
    description: "The jurisdiction is reviewing it.",
    token: "--status-review",
  },
  corrections_required: {
    label: "Corrections required",
    description: "The reviewer asked for changes.",
    token: "--status-corrections",
  },
  approved: {
    label: "Approved",
    description: "Issued by the jurisdiction.",
    token: "--status-approved",
  },
  rejected: {
    label: "Rejected",
    description: "Denied by the jurisdiction.",
    token: "--status-rejected",
  },
  expired: {
    label: "Expired",
    description: "Past its expiration date.",
    token: "--status-expired",
  },
  closed: {
    label: "Closed",
    description: "Finaled or no longer needed.",
    token: "--status-closed",
  },
}

export const PERMIT_STATUSES = Object.keys(PERMIT_STATUS_META) as PermitStatus[]

/** Statuses that count as "pending" on the dashboard. */
export const PENDING_STATUSES: PermitStatus[] = ["submitted", "under_review"]
/** Statuses that count towards a project's progress. */
export const DONE_STATUSES: PermitStatus[] = ["approved", "closed"]

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  building: "Building",
  electrical: "Electrical",
  plumbing: "Plumbing",
  mechanical: "Mechanical",
  demolition: "Demolition",
  grading: "Grading",
  fire: "Fire",
  signage: "Signage",
  other: "Other",
}

export const PERMIT_TYPES = Object.keys(PERMIT_TYPE_LABELS) as PermitType[]

export const statusColor = (status: PermitStatus) => `var(${PERMIT_STATUS_META[status].token})`
