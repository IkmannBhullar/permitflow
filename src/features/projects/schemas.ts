import { z } from "zod"

import { nullableDate, nullableUuid, optionalText } from "@/lib/schemas"

import { EDITABLE_PROJECT_STATUSES, PROJECT_TYPES } from "./constants"

const projectFields = z.object({
  name: z.string().trim().min(1, "Enter a project name.").max(120, "Keep it under 120 characters."),
  address: optionalText(200, "Address"),
  city: optionalText(100, "City"),
  jurisdiction: optionalText(120, "Jurisdiction"),
  project_type: z.enum(PROJECT_TYPES),
  status: z.enum(EDITABLE_PROJECT_STATUSES),
  manager_id: nullableUuid,
  start_date: nullableDate,
  target_completion_date: nullableDate,
})

const datesInOrder = (d: { start_date: string | null; target_completion_date: string | null }) =>
  !d.start_date || !d.target_completion_date || d.target_completion_date >= d.start_date

const DATE_ORDER_ISSUE = {
  path: ["target_completion_date"],
  message: "Target completion can't be before the start date.",
}

export const projectSchema = projectFields.refine(datesInOrder, DATE_ORDER_ISSUE)
export type ProjectInput = z.input<typeof projectSchema>

export const updateProjectSchema = projectFields
  .extend({ id: z.uuid() })
  .refine(datesInOrder, DATE_ORDER_ISSUE)

export const archiveProjectSchema = z.object({ id: z.uuid(), archived: z.boolean() })
