import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns"

/** Calendar dates are stored as 'YYYY-MM-DD'. "Today" is the UTC calendar day everywhere. */
export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Whole days from `from` to `to` (both 'YYYY-MM-DD'); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from))
}

export function formatDate(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback
  return format(parseISO(value), "MMM d, yyyy")
}

export function formatDateTime(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback
  return format(parseISO(value), "MMM d, yyyy 'at' h:mm a")
}

export function timeAgo(value: string): string {
  return `${formatDistanceToNowStrict(parseISO(value))} ago`
}

/** "in 3 days", "today", "2 days ago" relative to `today`. */
export function relativeDays(date: string, today: string = todayISO()): string {
  const diff = daysBetween(today, date)
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff === -1) return "yesterday"
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}
