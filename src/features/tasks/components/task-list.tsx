import { ListTodoIcon } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import type { SelectOption } from "@/components/form/select-field"
import { Badge } from "@/components/ui/badge"
import { canEdit, isAdmin, type OrgRole } from "@/features/orgs/roles"
import { formatDate, relativeDays, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"

import { isOverdue, TASK_PRIORITY_LABELS } from "../constants"
import type { TaskRow } from "../queries"
import { TaskDoneCheckbox } from "./task-done-checkbox"
import { TaskRowActions } from "./task-row-actions"

export function TaskList({
  tasks,
  orgSlug,
  role,
  names,
  members,
  permitOptionsFor,
  showPermit = true,
  showProject = false,
  action,
  emptyDescription,
}: {
  tasks: TaskRow[]
  orgSlug: string
  role: OrgRole
  names: Record<string, string>
  members: SelectOption[]
  /** Permit options for a task's project (used by the edit dialog). */
  permitOptionsFor: (projectId: string) => SelectOption[]
  showPermit?: boolean
  showProject?: boolean
  action?: React.ReactNode
  emptyDescription?: string
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodoIcon}
        title="No tasks yet"
        description={
          emptyDescription ??
          (action ? "Add a task to assign the next piece of work." : "Nothing assigned here yet.")
        }
        action={action}
      />
    )
  }
  const today = todayISO()
  const editor = canEdit(role)

  return (
    <ul aria-label="Tasks" className="divide-y rounded-lg border">
      {tasks.map((task) => {
        const done = task.status === "done"
        const overdue = isOverdue(task, today)
        return (
          <li key={task.id} className="flex items-start gap-3 px-3 py-2.5 text-sm">
            <div className="pt-0.5">
              <TaskDoneCheckbox
                orgSlug={orgSlug}
                taskId={task.id}
                title={task.title}
                done={done}
                disabled={!editor}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("font-medium", done && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
                {task.is_correction ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 text-amber-700 dark:text-amber-400"
                  >
                    Correction
                  </Badge>
                ) : null}
                {task.priority === "high" || task.priority === "urgent" ? (
                  <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </Badge>
                ) : null}
                {task.status === "in_progress" ? (
                  <Badge variant="secondary">In progress</Badge>
                ) : null}
              </div>
              <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>{task.assignee_id ? names[task.assignee_id] : "Unassigned"}</span>
                {task.due_date ? (
                  <span
                    className={cn(overdue && "font-medium text-destructive")}
                    title={formatDate(task.due_date)}
                  >
                    {overdue
                      ? `Overdue, due ${relativeDays(task.due_date, today)}`
                      : `Due ${relativeDays(task.due_date, today)}`}
                  </span>
                ) : null}
                {showProject ? (
                  <Link
                    href={`/app/${orgSlug}/projects/${task.project.id}`}
                    className="hover:underline"
                  >
                    {task.project.name}
                  </Link>
                ) : null}
                {showPermit && task.permit ? (
                  <Link
                    href={`/app/${orgSlug}/permits/${task.permit.id}`}
                    className="hover:underline"
                  >
                    {task.permit.name}
                  </Link>
                ) : null}
              </p>
            </div>
            {editor ? (
              <TaskRowActions
                orgSlug={orgSlug}
                task={task}
                members={members}
                permits={permitOptionsFor(task.project_id)}
                canDelete={isAdmin(role)}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
