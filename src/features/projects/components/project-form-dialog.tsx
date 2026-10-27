"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { DateField } from "@/components/form/date-field"
import { FormError } from "@/components/form/form-error"
import { SelectField, type SelectOption } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
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

import { createProject, updateProject } from "../actions"
import {
  EDITABLE_PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
} from "../constants"
import { projectSchema, type ProjectInput } from "../schemas"

const TYPE_OPTIONS = PROJECT_TYPES.map((t) => ({ value: t, label: PROJECT_TYPE_LABELS[t] }))
const STATUS_OPTIONS = EDITABLE_PROJECT_STATUSES.map((s) => ({
  value: s,
  label: PROJECT_STATUS_LABELS[s],
}))

const EMPTY: ProjectInput = {
  name: "",
  address: "",
  city: "",
  jurisdiction: "",
  project_type: "residential",
  status: "active",
  manager_id: null,
  start_date: null,
  target_completion_date: null,
}

export function ProjectFormDialog({
  orgSlug,
  members,
  project,
  trigger,
}: {
  orgSlug: string
  members: SelectOption[]
  project?: Tables<"projects">
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const defaults: ProjectInput = project
    ? {
        name: project.name,
        address: project.address,
        city: project.city,
        jurisdiction: project.jurisdiction,
        project_type: project.project_type,
        status: project.status === "archived" ? "active" : project.status,
        manager_id: project.manager_id,
        start_date: project.start_date,
        target_completion_date: project.target_completion_date,
      }
    : EMPTY
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaults,
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = project
        ? await updateProject(orgSlug, { ...values, id: project.id })
        : await createProject(orgSlug, values)
      if (!result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      toast.success(project ? "Project updated" : "Project created")
      setOpen(false)
      if (!project && result.data && "id" in result.data) {
        router.push(`/app/${orgSlug}/projects/${result.data.id}`)
      }
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
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {project
              ? "Update the project details."
              : "A project groups the permits, tasks and documents for one job site."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <FieldGroup>
            <FormError message={formError} />
            <TextField
              control={form.control}
              name="name"
              label="Project name"
              placeholder="Maple Street Duplex"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="project_type"
                label="Type"
                options={TYPE_OPTIONS}
              />
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                options={STATUS_OPTIONS}
              />
            </div>
            <TextField
              control={form.control}
              name="address"
              label="Address"
              autoComplete="street-address"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="city" label="City" />
              <TextField
                control={form.control}
                name="jurisdiction"
                label="Jurisdiction"
                placeholder="City or county"
              />
            </div>
            <SelectField
              control={form.control}
              name="manager_id"
              label="Project manager"
              options={members}
              noneLabel="No manager"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField control={form.control} name="start_date" label="Start date" />
              <DateField
                control={form.control}
                name="target_completion_date"
                label="Target completion"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>
              {project ? "Save changes" : "Create project"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
