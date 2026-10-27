import { z } from "zod"

/** Building blocks shared by feature schemas. Optional text is stored as '' rather than null. */

export const optionalText = (max: number, label = "This") =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`)

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")

export const nullableDate = isoDate.nullable()

export const nullableUuid = z.uuid().nullable()
