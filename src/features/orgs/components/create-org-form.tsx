"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { FieldGroup } from "@/components/ui/field"
import { applyServerErrors } from "@/lib/forms"

import { createOrganization } from "../actions"
import { createOrgSchema, type CreateOrgInput } from "../schemas"
import { slugify } from "../slug"

export function CreateOrgForm() {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", slug: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await createOrganization(values)
      if (result && !result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
      }
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        <FormError message={formError} />
        <TextField
          control={form.control}
          name="name"
          label="Company name"
          autoComplete="organization"
          placeholder="Cascade Ridge Builders"
          onChange={(e) => {
            if (!slugEdited) form.setValue("slug", slugify(e.target.value))
          }}
        />
        <TextField
          control={form.control}
          name="slug"
          label="URL"
          description="Used in links, e.g. /app/cascade-ridge. You can change it later."
          onChange={() => setSlugEdited(true)}
        />
      </FieldGroup>
      <SubmitButton pending={pending} className="w-full">
        Create organization
      </SubmitButton>
    </form>
  )
}
