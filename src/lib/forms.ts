import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import type { FieldErrors } from "@/lib/action-result"

/** Copies server-side Zod field errors onto a React Hook Form instance. */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: FieldErrors | undefined
) {
  if (!fieldErrors) return
  for (const [name, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) setError(name as Path<T>, { type: "server", message: messages[0] })
  }
}
