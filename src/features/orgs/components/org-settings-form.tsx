"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { FieldGroup } from "@/components/ui/field"
import { applyServerErrors } from "@/lib/forms"

import { updateOrganization } from "../actions"
import { updateOrgSchema, type UpdateOrgInput } from "../schemas"

export function OrgSettingsForm({ orgSlug, name }: { orgSlug: string; name: string }) {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<UpdateOrgInput>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: { name, slug: orgSlug },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await updateOrganization(orgSlug, values)
      if (result && !result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      toast.success("Organization updated")
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-6">
      <FieldGroup>
        <FormError message={formError} />
        <TextField control={form.control} name="name" label="Organization name" />
        <TextField
          control={form.control}
          name="slug"
          label="URL"
          description="Changing this changes every link to your organization. Old links stop working."
        />
      </FieldGroup>
      <SubmitButton pending={pending}>Save changes</SubmitButton>
    </form>
  )
}
