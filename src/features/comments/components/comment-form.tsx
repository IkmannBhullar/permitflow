"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { SubmitButton } from "@/components/form/submit-button"
import { TextareaField } from "@/components/form/text-field"
import { applyServerErrors } from "@/lib/forms"

import { addComment } from "../actions"
import { addCommentSchema, type AddCommentInput, type CommentEntity } from "../schemas"

export function CommentForm({
  orgSlug,
  entityType,
  entityId,
}: {
  orgSlug: string
  entityType: CommentEntity
  entityId: string
}) {
  const [pending, startTransition] = useTransition()
  const form = useForm<AddCommentInput>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { entity_type: entityType, entity_id: entityId, body: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await addComment(orgSlug, values)
      if (!result.ok) {
        toast.error(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      form.reset({ entity_type: entityType, entity_id: entityId, body: "" })
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <TextareaField
        control={form.control}
        name="body"
        label="Add a comment"
        placeholder="Reviewer called back about…"
        rows={3}
      />
      <div className="flex justify-end">
        <SubmitButton pending={pending} size="sm">
          Comment
        </SubmitButton>
      </div>
    </form>
  )
}
