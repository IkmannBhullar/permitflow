"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightLeftIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { DateField } from "@/components/form/date-field"
import { FormError } from "@/components/form/form-error"
import { SelectField } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
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

import { changePermitStatus } from "../actions"
import { changeStatusSchema, type ChangeStatusInput } from "../schemas"
import { PERMIT_STATUS_META, PERMIT_STATUSES, type PermitStatus } from "../status"

const OPTIONS = PERMIT_STATUSES.map((s) => ({ value: s, label: PERMIT_STATUS_META[s].label }))

export function StatusChangeDialog({
  orgSlug,
  permitId,
  status,
  approvedAt,
}: {
  orgSlug: string
  permitId: string
  status: PermitStatus
  approvedAt: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const defaults: ChangeStatusInput = {
    id: permitId,
    status,
    approved_at: approvedAt ?? todayISO(),
  }
  const form = useForm<ChangeStatusInput>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: defaults,
  })
  const next = useWatch({ control: form.control, name: "status" })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await changePermitStatus(orgSlug, {
        ...values,
        approved_at: values.status === "approved" ? values.approved_at : null,
      })
      if (!result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      toast.success(`Status changed to ${PERMIT_STATUS_META[values.status].label}`)
      setOpen(false)
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) {
          form.reset(defaults)
          setFormError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeftIcon /> Change status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>{PERMIT_STATUS_META[next ?? status].description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <FieldGroup>
            <FormError message={formError} />
            <SelectField
              control={form.control}
              name="status"
              label="New status"
              options={OPTIONS}
            />
            {next === "approved" ? (
              <DateField
                control={form.control}
                name="approved_at"
                label="Approval date"
                description="Required. Defaults to today."
              />
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending}>Update status</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
