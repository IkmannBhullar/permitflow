import { z } from "zod"

/** Result type shared by every Server Action and the client code that calls them. */

export type FieldErrors = Record<string, string[] | undefined>

export type ActionFailure = { ok: false; error: string; fieldErrors?: FieldErrors }

export type ActionResult<T = undefined> = { ok: true; data: T } | ActionFailure

export function ok<T = undefined>(data?: T): ActionResult<T> {
  return { ok: true, data: data as T }
}

export function fail(error: string, fieldErrors?: FieldErrors): ActionFailure {
  return { ok: false, error, fieldErrors }
}

export function invalid(error: z.ZodError): ActionFailure {
  return fail(
    "Please fix the highlighted fields.",
    z.flattenError(error).fieldErrors as FieldErrors
  )
}
