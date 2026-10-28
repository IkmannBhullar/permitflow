"use client"

import { Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"

import { deleteDocument } from "../actions"

export function DeleteDocumentButton({
  orgSlug,
  documentId,
}: {
  orgSlug: string
  documentId: string
}) {
  const router = useRouter()
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive" size="sm">
          <Trash2Icon /> Delete
        </Button>
      }
      title="Delete this document?"
      description="Every version and its file are permanently removed. This can't be undone."
      confirmLabel="Delete document"
      successMessage="Document deleted"
      onConfirm={async () => {
        const result = await deleteDocument(orgSlug, { id: documentId })
        if (result.ok) router.push(`/app/${orgSlug}/projects/${result.data.projectId}`)
        return result
      }}
    />
  )
}
