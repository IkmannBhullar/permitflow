"use client"

import { Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"

import { deletePermit } from "../actions"

export function DeletePermitButton({ orgSlug, permitId }: { orgSlug: string; permitId: string }) {
  const router = useRouter()
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive">
          <Trash2Icon /> Delete
        </Button>
      }
      title="Delete this permit?"
      description="Its tasks and comments are deleted too. Documents stay on the project. This can't be undone."
      confirmLabel="Delete permit"
      successMessage="Permit deleted"
      onConfirm={async () => {
        const result = await deletePermit(orgSlug, { id: permitId })
        if (result.ok) router.push(`/app/${orgSlug}/projects/${result.data.projectId}`)
        return result
      }}
    />
  )
}
