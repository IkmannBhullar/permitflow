/**
 * Maps database and API errors to messages that are safe to show users.
 * Raw errors are logged on the server and never returned to the client.
 */

const KNOWN_MESSAGES: Record<string, string> = {
  last_admin: "An organization must keep at least one admin.",
  invite_not_found: "This invite link is invalid or has been revoked.",
  invite_used: "This invite has already been used.",
  invite_expired: "This invite has expired. Ask an admin for a new link.",
  invite_email_mismatch:
    "This invite was sent to a different email address. Sign in with that address to accept it.",
  org_id_immutable: "Records can't be moved between organizations.",
  comment_entity_not_found: "That item no longer exists.",
  not_authenticated: "Your session has expired. Please sign in again.",
}

const CODE_MESSAGES: Record<string, string> = {
  "42501": "You don't have permission to do that.",
  "23505": "That already exists.",
  "23503": "A related record is missing or belongs to a different organization.",
  "23514": "Some values aren't allowed. Check the form and try again.",
  "22P02": "Some values aren't in the expected format.",
  PGRST116: "We couldn't find that record.",
}

export const GENERIC_ERROR = "Something went wrong. Please try again."

export type ErrorLike = { code?: string | null; message?: string | null } | null | undefined

export function toSafeMessage(error: ErrorLike, fallback = GENERIC_ERROR): string {
  if (!error) return fallback
  if (error.message && KNOWN_MESSAGES[error.message]) return KNOWN_MESSAGES[error.message]
  if (error.code && CODE_MESSAGES[error.code]) return CODE_MESSAGES[error.code]
  return fallback
}

/** Logs the raw error server-side and returns the safe message. */
export function reportError(context: string, error: unknown, fallback?: string): string {
  console.error(`[${context}]`, error)
  return toSafeMessage(error as ErrorLike, fallback)
}
