import {
  DONE_STATUSES,
  PENDING_STATUSES,
  EXPIRY_IGNORED_STATUSES,
  PERMIT_STATUS_META,
  PERMIT_TYPE_LABELS,
  type PermitStatus,
  type PermitType,
} from "@/features/permits/status"
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/features/projects/constants"
import { addDaysISO, daysBetween } from "@/lib/dates"

import type { Cell, Column } from "./csv"

export const REPORT_IDS = ["project-summary", "pending", "expiring", "corrections"] as const
export type ReportId = (typeof REPORT_IDS)[number]

export const REPORTS: Record<ReportId, { title: string; description: string }> = {
  "project-summary": {
    title: "Project permit summary",
    description: "Every project with its permits counted by status, progress and next expiration.",
  },
  pending: {
    title: "Pending permits",
    description: "Permits submitted or under review, with how long each has been waiting.",
  },
  expiring: {
    title: "Expiring permits",
    description: "Permits in play that expire within the chosen window, soonest first.",
  },
  corrections: {
    title: "Outstanding corrections",
    description: "Permits waiting on corrections and the open correction tasks for each.",
  },
}

export const EXPIRING_WINDOWS = [7, 14, 30, 60, 90] as const

export type ReportPermit = {
  id: string
  name: string
  status: PermitStatus
  permit_type: PermitType
  application_number: string | null
  jurisdiction: string
  submitted_at: string | null
  expires_at: string | null
  status_changed_at: string
  assignee_id: string | null
  project: { id: string; name: string }
}

export type ReportProject = {
  id: string
  name: string
  status: ProjectStatus
  city: string
  manager_id: string | null
}

export type ReportTask = {
  id: string
  title: string
  status: "todo" | "in_progress" | "done"
  due_date: string | null
  is_correction: boolean
  permit_id: string | null
  assignee_id: string | null
}

export type ReportData = { permits: ReportPermit[]; projects: ReportProject[]; tasks: ReportTask[] }
export type ReportResult = {
  columns: Column[]
  rows: (Record<string, Cell> & { href?: string })[]
  summary: string
}

const label = (s: PermitStatus) => PERMIT_STATUS_META[s].label

/** Pure: builds a report's rows from raw org data. Used for the on-screen table, print view and CSV alike. */
export function buildReport(
  id: ReportId,
  data: ReportData,
  { today, names, days = 30 }: { today: string; names: Record<string, string>; days?: number }
): ReportResult {
  const who = (userId: string | null) =>
    userId ? (names[userId] ?? "Former member") : "Unassigned"

  switch (id) {
    case "project-summary": {
      const rows = data.projects
        .filter((p) => p.status !== "archived")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((project) => {
          const permits = data.permits.filter((p) => p.project.id === project.id)
          const count = (statuses: PermitStatus[]) =>
            permits.filter((p) => statuses.includes(p.status)).length
          const done = count(DONE_STATUSES)
          const nextExpiry = permits
            .filter(
              (p) =>
                p.expires_at && p.expires_at >= today && !EXPIRY_IGNORED_STATUSES.includes(p.status)
            )
            .map((p) => p.expires_at!)
            .sort()[0]
          return {
            href: `projects/${project.id}`,
            project: project.name,
            status: PROJECT_STATUS_LABELS[project.status],
            manager: who(project.manager_id),
            total: permits.length,
            draft: count(["draft"]),
            pending: count(PENDING_STATUSES),
            corrections: count(["corrections_required"]),
            approved: count(["approved"]),
            closed: count(["closed"]),
            rejected_expired: count(["rejected", "expired"]),
            progress: permits.length ? `${Math.round((done / permits.length) * 100)}%` : "0%",
            next_expiry: nextExpiry ?? "",
          }
        })
      return {
        columns: [
          { key: "project", header: "Project" },
          { key: "status", header: "Project status" },
          { key: "manager", header: "Manager" },
          { key: "total", header: "Permits" },
          { key: "draft", header: "Draft" },
          { key: "pending", header: "Pending" },
          { key: "corrections", header: "Corrections" },
          { key: "approved", header: "Approved" },
          { key: "closed", header: "Closed" },
          { key: "rejected_expired", header: "Rejected/expired" },
          { key: "progress", header: "Progress" },
          { key: "next_expiry", header: "Next expiration" },
        ],
        rows,
        summary: `${rows.length} active project${rows.length === 1 ? "" : "s"}, ${rows.reduce((n, r) => n + r.total, 0)} permits.`,
      }
    }

    case "pending": {
      const rows = data.permits
        .filter((p) => PENDING_STATUSES.includes(p.status))
        .map((p) => {
          const since = p.submitted_at ?? p.status_changed_at.slice(0, 10)
          return {
            href: `permits/${p.id}`,
            permit: p.name,
            project: p.project.name,
            type: PERMIT_TYPE_LABELS[p.permit_type],
            status: label(p.status),
            application_number: p.application_number ?? "",
            jurisdiction: p.jurisdiction,
            submitted: p.submitted_at ?? "",
            days_waiting: daysBetween(since, today),
            assignee: who(p.assignee_id),
          }
        })
        .sort((a, b) => b.days_waiting - a.days_waiting)
      return {
        columns: [
          { key: "permit", header: "Permit" },
          { key: "project", header: "Project" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status" },
          { key: "application_number", header: "Application #" },
          { key: "jurisdiction", header: "Jurisdiction" },
          { key: "submitted", header: "Submitted" },
          { key: "days_waiting", header: "Days waiting" },
          { key: "assignee", header: "Assignee" },
        ],
        rows,
        summary: `${rows.length} pending permit${rows.length === 1 ? "" : "s"}.`,
      }
    }

    case "expiring": {
      const end = addDaysISO(today, days)
      const rows = data.permits
        .filter(
          (p) =>
            p.expires_at &&
            p.expires_at >= today &&
            p.expires_at <= end &&
            !EXPIRY_IGNORED_STATUSES.includes(p.status)
        )
        .sort((a, b) => a.expires_at!.localeCompare(b.expires_at!))
        .map((p) => ({
          href: `permits/${p.id}`,
          permit: p.name,
          project: p.project.name,
          type: PERMIT_TYPE_LABELS[p.permit_type],
          status: label(p.status),
          expires: p.expires_at!,
          days_left: daysBetween(today, p.expires_at!),
          assignee: who(p.assignee_id),
        }))
      return {
        columns: [
          { key: "permit", header: "Permit" },
          { key: "project", header: "Project" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status" },
          { key: "expires", header: "Expires" },
          { key: "days_left", header: "Days left" },
          { key: "assignee", header: "Assignee" },
        ],
        rows,
        summary: `${rows.length} permit${rows.length === 1 ? "" : "s"} expiring in the next ${days} days.`,
      }
    }

    case "corrections": {
      const rows = data.permits
        .filter((p) => p.status === "corrections_required")
        .map((p) => {
          const open = data.tasks
            .filter((t) => t.permit_id === p.id && t.is_correction && t.status !== "done")
            .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
          return {
            href: `permits/${p.id}`,
            permit: p.name,
            project: p.project.name,
            assignee: who(p.assignee_id),
            days_waiting: daysBetween(p.status_changed_at.slice(0, 10), today),
            open_tasks: open.length,
            next_due: open.find((t) => t.due_date)?.due_date ?? "",
            overdue_tasks: open.filter((t) => t.due_date && t.due_date < today).length,
            tasks: open.map((t) => `${t.title} (${who(t.assignee_id)})`).join("; "),
          }
        })
        .sort((a, b) => b.days_waiting - a.days_waiting)
      return {
        columns: [
          { key: "permit", header: "Permit" },
          { key: "project", header: "Project" },
          { key: "assignee", header: "Assignee" },
          { key: "days_waiting", header: "Days in corrections" },
          { key: "open_tasks", header: "Open correction tasks" },
          { key: "overdue_tasks", header: "Overdue" },
          { key: "next_due", header: "Next due" },
          { key: "tasks", header: "Tasks" },
        ],
        rows,
        summary: `${rows.length} permit${rows.length === 1 ? "" : "s"} waiting on corrections.`,
      }
    }
  }
}

export function parseReportParams(params: Record<string, string | string[] | undefined>) {
  const days = Number(Array.isArray(params.days) ? params.days[0] : params.days)
  return { days: (EXPIRING_WINDOWS as readonly number[]).includes(days) ? days : 30 }
}
