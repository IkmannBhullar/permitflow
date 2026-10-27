"use client"

import { Trash2Icon } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"

import { deleteComment } from "../actions"

export function DeleteCommentButton({
  orgSlug,
  commentId,
}: {
  orgSlug: string
  commentId: string
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-xs" aria-label="Delete comment">
          <Trash2Icon />
        </Button>
      }
      title="Delete this comment?"
      description="This can't be undone."
      confirmLabel="Delete comment"
      successMessage="Comment deleted"
      onConfirm={() => deleteComment(orgSlug, { id: commentId })}
    />
  )
}
