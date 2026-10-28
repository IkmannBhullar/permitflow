import { EXPIRY_IGNORED_STATUSES, type PermitStatus } from "@/features/permits/status"
import type { TaskStatus } from "@/features/tasks/constants"
import { daysBetween } from "@/lib/dates"

/** Expiry warnings go out when a permit is this many days (or fewer) from expiring. */
export const EXPIRY_THRESHOLDS = [30, 14, 7] as const

export type DuePermit = {
  id: string
  org_id: string
  name: string
  status: PermitStatus
  expires_at: string | null
  assignee_id: string | null
  project: { name: string; manager_id: string | null }
}

export type DueTask = {
  id: string
  org_id: string
  title: string
  status: TaskStatus
  due_date: string | null
  assignee_id: string | null
  permit_id: string | null
  project_id: string
}

export type DueNotification = {
  org_id: string
  user_id: string
  type: "permit_expiring" | "task_overdue"
  title: string
  body: string
  link: string
  dedupe_key: string
}

/** The tightest threshold a permit has reached, e.g. 10 days out -> 14. Null when not yet in range. */
export function expiryThreshold(daysLeft: number): number | null {
  if (daysLeft < 0) return null
  const reached = EXPIRY_THRESHOLDS.filter((t) => daysLeft <= t)
  return reached.length ? Math.min(...reached) : null
}

/**
 * Pure: which time-based notifications should exist today. Each carries a dedupe key, and
 * inserts ignore existing keys, so running this any number of times per day (or catching up
 * after a missed day) never sends the same reminder twice. Keys include the date involved, so
 * moving an expiration or due date re-arms the reminders.
 */
export function computeDueNotifications(
  permits: DuePermit[],
  tasks: DueTask[],
  today: string
): DueNotification[] {
  const out: DueNotification[] = []

  for (const p of permits) {
    if (!p.expires_at || EXPIRY_IGNORED_STATUSES.includes(p.status)) continue
    const recipient = p.assignee_id ?? p.project.manager_id
    if (!recipient) continue
    const daysLeft = daysBetween(today, p.expires_at)
    const threshold = expiryThreshold(daysLeft)
    if (threshold === null) continue
    out.push({
      org_id: p.org_id,
      user_id: recipient,
      type: "permit_expiring",
      title: `${p.name} expires ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}`,
      body: `${p.project.name}. Renew, extend or finish the work before it lapses.`,
      link: `permits/${p.id}`,
      dedupe_key: `permit_expiring:${p.id}:${threshold}d:${p.expires_at}`,
    })
  }

  for (const t of tasks) {
    if (t.status === "done" || !t.due_date || !t.assignee_id || t.due_date >= today) continue
    out.push({
      org_id: t.org_id,
      user_id: t.assignee_id,
      type: "task_overdue",
      title: `Overdue: ${t.title}`,
      body: `It was due ${daysBetween(t.due_date, today)} day(s) ago.`,
      link: t.permit_id ? `permits/${t.permit_id}` : `projects/${t.project_id}`,
      dedupe_key: `task_overdue:${t.id}:${t.due_date}`,
    })
  }
  return out
}
