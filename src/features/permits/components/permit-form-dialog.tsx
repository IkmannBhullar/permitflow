"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { toast } from "sonner"

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
import { todayISO } from "@/lib/dates"
import { applyServerErrors } from "@/lib/forms"
import type { Tables } from "@/lib/supabase/database.types"

import { createPermit, updatePermit } from "../actions"
import { createPermitSchema, updatePermitSchema, type CreatePermitInput } from "../schemas"
import { PERMIT_STATUS_META, PERMIT_STATUSES, PERMIT_TYPE_LABELS, PERMIT_TYPES } from "../status"

const TYPE_OPTIONS = PERMIT_TYPES.map((t) => ({ value: t, label: PERMIT_TYPE_LABELS[t] }))
const STATUS_OPTIONS = PERMIT_STATUSES.map((s) => ({
  value: s,
  label: PERMIT_STATUS_META[s].label,
}))

type FormValues = CreatePermitInput & { id?: string }

export function PermitFormDialog({
  orgSlug,
  members,
  projects,
  permit,
  defaultProjectId,
  trigger,
}: {
  orgSlug: string
  members: SelectOption[]
  projects: SelectOption[]
  permit?: Tables<"permits">
  defaultProjectId?: string
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const editing = Boolean(permit)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const defaults: FormValues = permit
    ? {
        id: permit.id,
        project_id: permit.project_id,
        name: permit.name,
        permit_type: permit.permit_type,
        jurisdiction: permit.jurisdiction,
        application_number: permit.application_number ?? "",
        assignee_id: permit.assignee_id,
        submitted_at: permit.submitted_at,
        expires_at: permit.expires_at,
        notes: permit.notes,
        status: permit.status,
        approved_at: permit.approved_at,
      }
    : {
        project_id: defaultProjectId ?? "",
        name: "",
        permit_type: "building",
        jurisdiction: "",
        application_number: "",
        assignee_id: null,
        submitted_at: null,
        expires_at: null,
        notes: "",
        status: "draft",
        approved_at: null,
      }

  const form = useForm<FormValues>({
    resolver: zodResolver(
      editing ? updatePermitSchema : createPermitSchema
    ) as Resolver<FormValues>,
    defaultValues: defaults,
  })
  const status = useWatch({ control: form.control, name: "status" })

  // Approving pre-fills today's date; the user can change it but not clear it.
  useEffect(() => {
    if (!editing && status === "approved" && !form.getValues("approved_at")) {
      form.setValue("approved_at", todayISO())
    }
  }, [editing, status, form])

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = permit
        ? await updatePermit(orgSlug, { ...values, id: permit.id })
        : await createPermit(orgSlug, values)
      if (!result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      toast.success(permit ? "Permit updated" : "Permit added")
      setOpen(false)
      if (!permit && result.data && "id" in result.data)
        router.push(`/app/${orgSlug}/permits/${result.data.id}`)
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
          <DialogTitle>{permit ? "Edit permit" : "Add permit"}</DialogTitle>
          <DialogDescription>
            {permit
              ? "Status changes go through “Change status”."
              : "Track an application with the jurisdiction."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <FieldGroup>
            <FormError message={formError} />
            <SelectField
              control={form.control}
              name="project_id"
              label="Project"
              options={projects}
              placeholder="Choose a project"
            />
            <TextField
              control={form.control}
              name="name"
              label="Permit name"
              placeholder="Building permit – new SFR"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="permit_type"
                label="Type"
                options={TYPE_OPTIONS}
              />
              {editing ? null : (
                <SelectField
                  control={form.control}
                  name="status"
                  label="Current status"
                  options={STATUS_OPTIONS}
                />
              )}
            </div>
            {!editing && status === "approved" ? (
              <DateField control={form.control} name="approved_at" label="Approval date" />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="jurisdiction"
                label="Jurisdiction"
                placeholder="City of Riverton"
              />
              <TextField control={form.control} name="application_number" label="Application #" />
            </div>
            <SelectField
              control={form.control}
              name="assignee_id"
              label="Assignee"
              options={members}
              noneLabel="Unassigned"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField control={form.control} name="submitted_at" label="Submitted" />
              <DateField control={form.control} name="expires_at" label="Expires" />
            </div>
            <TextareaField control={form.control} name="notes" label="Notes" rows={4} />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>{permit ? "Save changes" : "Add permit"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
