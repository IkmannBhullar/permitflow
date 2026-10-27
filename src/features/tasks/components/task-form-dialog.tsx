"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"

import { CheckboxField } from "@/components/form/checkbox-field"
import { DateField } from "@/components/form/date-field"
import { FormError } from "@/components/form/form-error"
import { SelectField, type SelectOption } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextareaField, TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { applyServerErrors } from "@/lib/forms"
import type { Tables } from "@/lib/supabase/database.types"

import { createTask, updateTask } from "../actions"
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from "../constants"
import { taskSchema, updateTaskSchema, type TaskInput } from "../schemas"

const PRIORITY_OPTIONS = TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))
const STATUS_OPTIONS = TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))

type FormValues = TaskInput & { id?: string }

export function TaskFormDialog({
  orgSlug,
  projectId,
  members,
  permits,
  task,
  defaultPermitId = null,
  defaultCorrection = false,
  trigger,
}: {
  orgSlug: string
  projectId: string
  members: SelectOption[]
  /** Permits of this project that the task can be linked to. */
  permits: SelectOption[]
  task?: Tables<"tasks">
  defaultPermitId?: string | null
  defaultCorrection?: boolean
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const defaults: FormValues = task
    ? {
        id: task.id,
        project_id: task.project_id,
        permit_id: task.permit_id,
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        is_correction: task.is_correction,
      }
    : {
        project_id: projectId,
        permit_id: defaultPermitId,
        title: "",
        description: "",
        assignee_id: null,
        due_date: null,
        priority: "medium",
        status: "todo",
        is_correction: defaultCorrection,
      }
  const form = useForm<FormValues>({
    resolver: zodResolver(task ? updateTaskSchema : taskSchema) as Resolver<FormValues>,
    defaultValues: defaults,
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = task
        ? await updateTask(orgSlug, { ...values, id: task.id })
        : await createTask(orgSlug, values)
      if (!result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      toast.success(task ? "Task updated" : "Task added")
      setOpen(false)
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          form.reset(defaults)
          setFormError(null)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>Assign work with a due date so nothing slips.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <FieldGroup>
            <FormError message={formError} />
            <TextField
              control={form.control}
              name="title"
              label="Title"
              placeholder="Revise egress window detail"
            />
            <TextareaField control={form.control} name="description" label="Description" rows={3} />
            <SelectField
              control={form.control}
              name="permit_id"
              label="Linked permit"
              options={permits}
              noneLabel="No permit"
            />
            <CheckboxField
              control={form.control}
              name="is_correction"
              label="Correction requested by the reviewer"
              description="Tracks work needed to resolve a permit's corrections."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="assignee_id"
                label="Assignee"
                options={members}
                noneLabel="Unassigned"
              />
              <DateField control={form.control} name="due_date" label="Due date" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="priority"
                label="Priority"
                options={PRIORITY_OPTIONS}
              />
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                options={STATUS_OPTIONS}
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>{task ? "Save changes" : "Add task"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
