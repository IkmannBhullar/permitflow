import { ROLE_LABELS, type OrgRole } from "@/features/orgs/roles"
import { PERMIT_STATUS_META, type PermitStatus } from "@/features/permits/status"
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/features/projects/constants"
import type { Json, Tables } from "@/lib/supabase/database.types"

export type ActivityRow = Tables<"activity_log"> & { actor: { full_name: string } | null }

type Meta = Record<string, Json | undefined>

const FIELD_LABELS: Record<string, string> = {
  name: "name",
  title: "title",
  notes: "notes",
  description: "description",
  address: "address",
  city: "city",
  jurisdiction: "jurisdiction",
  project_type: "type",
  permit_type: "type",
  application_number: "application number",
  submitted_at: "submitted date",
  approved_at: "approval date",
  expires_at: "expiration date",
  start_date: "start date",
  target_completion_date: "target date",
  due_date: "due date",
  priority: "priority",
  project_id: "project",
  permit_id: "linked permit",
  is_correction: "correction flag",
}

function statusLabel(entity: string, value: unknown): string {
  const v = String(value)
  if (entity === "permit") return PERMIT_STATUS_META[v as PermitStatus]?.label ?? v
  if (entity === "project") return PROJECT_STATUS_LABELS[v as ProjectStatus] ?? v
  return v === "in_progress" ? "In progress" : v === "todo" ? "To do" : v === "done" ? "Done" : v
}

function listFields(fields: unknown): string {
  const names = (Array.isArray(fields) ? fields : []).map(
    (f) => FIELD_LABELS[String(f)] ?? String(f)
  )
  if (names.length <= 1) return names[0] ?? "details"
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
}

/**
 * Turns an activity row into a sentence fragment that follows the actor's name,
 * e.g. "changed Building permit from Draft to Submitted".
 */
export function describeActivity(
  row: Pick<ActivityRow, "action" | "entity_type" | "metadata">,
  nameOf: (id: string) => string
): string {
  const m = (row.metadata ?? {}) as Meta
  const label = String(m.name ?? m.title ?? "")
  const noun =
    row.entity_type === "permit"
      ? "permit"
      : row.entity_type === "task"
        ? "task"
        : row.entity_type === "document"
          ? "document"
          : "project"
  const subject = label ? `${noun} ${label}` : `a ${noun}`

  switch (row.action) {
    case "created":
      return row.entity_type === "project"
        ? `created ${subject}`
        : `added ${m.is_correction ? "correction task" : noun} ${label}`.trim()
    case "updated":
      return `updated the ${listFields(m.fields)} of ${subject}`
    case "status_changed":
      return `changed ${subject} from ${statusLabel(row.entity_type, m.from)} to ${statusLabel(row.entity_type, m.to)}`
    case "assigned": {
      const to = typeof m.to === "string" ? nameOf(m.to) : null
      if (m.role === "manager")
        return to ? `made ${to} manager of ${subject}` : `removed the manager of ${subject}`
      return to ? `assigned ${subject} to ${to}` : `unassigned ${subject}`
    }
    case "completed":
      return `completed ${subject}`
    case "reopened":
      return `reopened ${subject}`
    case "uploaded":
      return Number(m.version) > 1
        ? `uploaded version ${m.version} of ${label}`
        : `uploaded ${label}`
    case "commented":
      return `commented on ${label ? subject : `the ${noun}`}: “${String(m.excerpt ?? "")}”`
    case "archived":
      return `archived ${subject}`
    case "deleted":
      return `deleted ${subject}`
    case "member_added":
      return `joined as ${ROLE_LABELS[m.role as OrgRole] ?? m.role}`
    case "member_role_changed":
      return `changed a role from ${ROLE_LABELS[m.from as OrgRole]} to ${ROLE_LABELS[m.to as OrgRole]}`
    case "member_removed":
      return "removed a member"
    default:
      return row.action.replaceAll("_", " ")
  }
}

/** Path inside the org that the activity item should link to, if the record still exists. */
export function activityHref(
  row: Pick<ActivityRow, "action" | "entity_type" | "entity_id" | "project_id" | "metadata">
): string | null {
  if (row.action === "deleted") return row.project_id ? `projects/${row.project_id}` : null
  const m = (row.metadata ?? {}) as Meta
  switch (row.entity_type) {
    case "project":
      return `projects/${row.entity_id}`
    case "permit":
      return `permits/${row.entity_id}`
    case "task":
    case "document":
      if (typeof m.permit_id === "string") return `permits/${m.permit_id}`
      return row.project_id ? `projects/${row.project_id}` : null
    default:
      return null
  }
}
