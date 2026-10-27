import { z } from "zod"

import { isoDate, nullableDate, nullableUuid, optionalText } from "@/lib/schemas"

import { PERMIT_STATUSES, PERMIT_TYPES } from "./status"

const APPROVED_DATE_ISSUE = {
  path: ["approved_at"],
  message: "Enter the approval date. A permit can't be approved without one.",
}

const requireApprovalDate = (d: { status?: string; approved_at?: string | null }) =>
  d.status !== "approved" || Boolean(d.approved_at)

const permitFields = z.object({
  project_id: z.uuid("Choose a project."),
  name: z.string().trim().min(1, "Enter a permit name.").max(160, "Keep it under 160 characters."),
  permit_type: z.enum(PERMIT_TYPES),
  jurisdiction: optionalText(120, "Jurisdiction"),
  application_number: optionalText(80, "Application number"),
  assignee_id: nullableUuid,
  submitted_at: nullableDate,
  expires_at: nullableDate,
  notes: optionalText(10000, "Notes"),
})

/** Creating a permit can record its current status, e.g. when entering an already-approved permit. */
export const createPermitSchema = permitFields
  .extend({ status: z.enum(PERMIT_STATUSES), approved_at: nullableDate })
  .refine(requireApprovalDate, APPROVED_DATE_ISSUE)
export type CreatePermitInput = z.input<typeof createPermitSchema>

/** Editing details never changes status; that goes through the status dialog. */
export const updatePermitSchema = permitFields.extend({ id: z.uuid() })
export type UpdatePermitInput = z.input<typeof updatePermitSchema>

export const changeStatusSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(PERMIT_STATUSES),
    approved_at: isoDate.nullable().optional(),
  })
  .refine(requireApprovalDate, APPROVED_DATE_ISSUE)
export type ChangeStatusInput = z.input<typeof changeStatusSchema>

export const deletePermitSchema = z.object({ id: z.uuid() })
