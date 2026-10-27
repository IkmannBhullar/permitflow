import { z } from "zod"

import { nullableDate, nullableUuid, optionalText } from "@/lib/schemas"

import { TASK_PRIORITIES, TASK_STATUSES } from "./constants"

const taskFields = z.object({
  project_id: z.uuid("Choose a project."),
  permit_id: nullableUuid,
  title: z.string().trim().min(1, "Enter a task title.").max(200, "Keep it under 200 characters."),
  description: optionalText(5000, "Description"),
  assignee_id: nullableUuid,
  due_date: nullableDate,
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  is_correction: z.boolean(),
})

const CORRECTION_ISSUE = {
  path: ["permit_id"],
  message: "Correction tasks must be linked to the permit that needs corrections.",
}
const correctionHasPermit = (t: { is_correction: boolean; permit_id: string | null }) =>
  !t.is_correction || Boolean(t.permit_id)

export const taskSchema = taskFields.refine(correctionHasPermit, CORRECTION_ISSUE)
export type TaskInput = z.input<typeof taskSchema>

export const updateTaskSchema = taskFields
  .extend({ id: z.uuid() })
  .refine(correctionHasPermit, CORRECTION_ISSUE)

export const setTaskDoneSchema = z.object({ id: z.uuid(), done: z.boolean() })
export const deleteTaskSchema = z.object({ id: z.uuid() })
