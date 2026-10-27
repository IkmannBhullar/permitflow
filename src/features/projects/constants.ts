import type { Database } from "@/lib/supabase/database.types"

export type ProjectStatus = Database["public"]["Enums"]["project_status"]
export type ProjectType = Database["public"]["Enums"]["project_type"]

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  renovation: "Renovation",
  other: "Other",
}
export const PROJECT_TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
}

/** Statuses a user can pick in the form. Archiving is a separate, admin-only action. */
export const EDITABLE_PROJECT_STATUSES = ["active", "on_hold", "completed"] as const
