import { z } from "zod"

import { SLUG_PATTERN } from "./slug"

export const orgNameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(80, "Keep it under 80 characters.")

export const orgSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    SLUG_PATTERN,
    "Use 3–48 lowercase letters, numbers or hyphens, starting and ending with a letter or number."
  )

export const createOrgSchema = z.object({ name: orgNameSchema, slug: orgSlugSchema })
export type CreateOrgInput = z.input<typeof createOrgSchema>

export const updateOrgSchema = createOrgSchema
export type UpdateOrgInput = z.input<typeof updateOrgSchema>
