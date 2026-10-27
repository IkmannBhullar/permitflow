import { isOverdue, type TaskStatus } from "@/features/tasks/constants"
import {
  EXPIRY_IGNORED_STATUSES,
  PENDING_STATUSES,
  PERMIT_STATUSES,
  type PermitStatus,
} from "@/features/permits/status"
import { addDaysISO, daysBetween } from "@/lib/dates"

/**
 * Pure aggregation for the dashboard. Inputs are rows straight from the database;
 * nothing here is hardcoded except the time windows below.
 */

export const EXPIRING_WINDOW_DAYS = 30
export const STALLED_AFTER_DAYS = 30
export const DEADLINE_WINDOW_DAYS = 14
export const EXPIRY_CHART_WEEKS = 8

export type DashPermit = {
  id: string
  name: string
  status: PermitStatus
  expires_at: string | null
  status_changed_at: string
  project: { id: string; name: string }
}

export type DashTask = {
  id: string
  title: string
  status: TaskStatus
  due_date: string | null
  is_correction: boolean
  permit_id: string | null
  project_id: string
}

export type DashboardStats = {
  activeProjects: number
  totalPermits: number
  pending: number
  approved: number
  correctionsRequired: number
  expiringSoon: number
  overdueTasks: number
}

const tracksExpiry = (p: DashPermit) => !EXPIRY_IGNORED_STATUSES.includes(p.status)

export function isExpiringWithin(p: DashPermit, today: string, days: number) {
  return (
    tracksExpiry(p) &&
    p.expires_at !== null &&
    p.expires_at >= today &&
    p.expires_at <= addDaysISO(today, days)
  )
}

export function isStalled(p: DashPermit, today: string) {
  return (
    PENDING_STATUSES.includes(p.status) &&
    daysBetween(p.status_changed_at.slice(0, 10), today) > STALLED_AFTER_DAYS
  )
}

export function computeStats(
  permits: DashPermit[],
  tasks: DashTask[],
  activeProjects: number,
  today: string
): DashboardStats {
  return {
    activeProjects,
    totalPermits: permits.length,
    pending: permits.filter((p) => PENDING_STATUSES.includes(p.status)).length,
    approved: permits.filter((p) => p.status === "approved").length,
    correctionsRequired: permits.filter((p) => p.status === "corrections_required").length,
    expiringSoon: permits.filter((p) => isExpiringWithin(p, today, EXPIRING_WINDOW_DAYS)).length,
    overdueTasks: tasks.filter((t) => isOverdue(t, today)).length,
  }
}

export function permitsByStatus(permits: DashPermit[]): { status: PermitStatus; count: number }[] {
  return PERMIT_STATUSES.map((status) => ({
    status,
    count: permits.filter((p) => p.status === status).length,
  }))
}

/** Permits expiring in each of the next N weeks; week 1 starts today. */
export function expiringByWeek(permits: DashPermit[], today: string, weeks = EXPIRY_CHART_WEEKS) {
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDaysISO(today, i * 7)
    const end = addDaysISO(today, i * 7 + 6)
    const count = permits.filter(
      (p) =>
        tracksExpiry(p) && p.expires_at !== null && p.expires_at >= start && p.expires_at <= end
    ).length
    return { week: i + 1, start, end, count }
  })
}

export type AttentionItem = {
  kind: "corrections" | "expiring" | "overdue_task" | "stalled"
  id: string
  title: string
  detail: string
  href: string
  /** Lower is more urgent. */
  rank: number
}

export function needsAttention(
  permits: DashPermit[],
  tasks: DashTask[],
  today: string
): AttentionItem[] {
  const items: AttentionItem[] = []
  for (const p of permits) {
    if (p.status === "corrections_required") {
      items.push({
        kind: "corrections",
        id: p.id,
        title: p.name,
        detail: `${p.project.name} · corrections required`,
        href: `permits/${p.id}`,
        rank: 0,
      })
    }
    if (isExpiringWithin(p, today, EXPIRING_WINDOW_DAYS)) {
      const days = daysBetween(today, p.expires_at!)
      items.push({
        kind: "expiring",
        id: p.id,
        title: p.name,
        detail: `${p.project.name} · expires ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`,
        href: `permits/${p.id}`,
        rank: 1 + days / 100,
      })
    }
    if (isStalled(p, today)) {
      const days = daysBetween(p.status_changed_at.slice(0, 10), today)
      items.push({
        kind: "stalled",
        id: p.id,
        title: p.name,
        detail: `${p.project.name} · in review for ${days} days`,
        href: `permits/${p.id}`,
        rank: 3,
      })
    }
  }
  for (const t of tasks) {
    if (isOverdue(t, today)) {
      const days = daysBetween(t.due_date!, today)
      items.push({
        kind: "overdue_task",
        id: t.id,
        title: t.title,
        detail: `${t.is_correction ? "Correction task" : "Task"} · ${days} day${days === 1 ? "" : "s"} overdue`,
        href: t.permit_id ? `permits/${t.permit_id}` : `projects/${t.project_id}`,
        rank: 2 - Math.min(days, 99) / 100,
      })
    }
  }
  return items.sort((a, b) => a.rank - b.rank)
}

export type Deadline = {
  kind: "permit_expires" | "task_due"
  id: string
  title: string
  date: string
  href: string
}

export function upcomingDeadlines(
  permits: DashPermit[],
  tasks: DashTask[],
  today: string,
  days = DEADLINE_WINDOW_DAYS
): Deadline[] {
  const end = addDaysISO(today, days)
  const within = (d: string | null): d is string => d !== null && d >= today && d <= end
  return [
    ...permits
      .filter((p) => tracksExpiry(p) && within(p.expires_at))
      .map((p) => ({
        kind: "permit_expires" as const,
        id: p.id,
        title: p.name,
        date: p.expires_at!,
        href: `permits/${p.id}`,
      })),
    ...tasks
      .filter((t) => t.status !== "done" && within(t.due_date))
      .map((t) => ({
        kind: "task_due" as const,
        id: t.id,
        title: t.title,
        date: t.due_date!,
        href: t.permit_id ? `permits/${t.permit_id}` : `projects/${t.project_id}`,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}
