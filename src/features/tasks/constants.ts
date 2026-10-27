import type { Database } from "@/lib/supabase/database.types"

export type TaskPriority = Database["public"]["Enums"]["task_priority"]
export type TaskStatus = Database["public"]["Enums"]["task_status"]

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}
export const TASK_PRIORITIES = Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
}
export const TASK_STATUSES = Object.keys(TASK_STATUS_LABELS) as TaskStatus[]

/** Open tasks whose due date is before today. */
export function isOverdue(
  task: { status: TaskStatus; due_date: string | null },
  today: string
): boolean {
  return task.status !== "done" && task.due_date !== null && task.due_date < today
}
