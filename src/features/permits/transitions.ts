import type { PermitStatus } from "./status"

type StatusPatch = { status: PermitStatus; approved_at?: string | null }

/**
 * Builds the update for a status change. Approving requires a date (the form
 * pre-fills today, the database CHECK enforces it); leaving "approved" keeps the
 * recorded approval date for history. Submission dates are stamped by the database.
 */
export function buildStatusPatch(
  current: PermitStatus,
  next: { status: PermitStatus; approved_at?: string | null }
): { ok: true; patch: StatusPatch } | { ok: false; error: string } {
  if (next.status === current && next.status !== "approved") {
    return { ok: false, error: "The permit already has that status." }
  }
  if (next.status === "approved") {
    if (!next.approved_at)
      return {
        ok: false,
        error: "Enter the approval date. A permit can't be approved without one.",
      }
    return { ok: true, patch: { status: "approved", approved_at: next.approved_at } }
  }
  return { ok: true, patch: { status: next.status } }
}
