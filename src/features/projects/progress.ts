import { DONE_STATUSES, type PermitStatus } from "@/features/permits/status"

export type Progress = { done: number; total: number; percent: number }

/** Share of a project's permits that are approved or closed. Rejected permits still count as open work. */
export function projectProgress(statuses: PermitStatus[]): Progress {
  const total = statuses.length
  const done = statuses.filter((s) => DONE_STATUSES.includes(s)).length
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}
