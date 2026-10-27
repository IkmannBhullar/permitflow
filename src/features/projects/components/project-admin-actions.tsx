"use client"

import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"

import { setProjectArchived } from "../actions"

export function ArchiveProjectButton({
  orgSlug,
  projectId,
  archived,
}: {
  orgSlug: string
  projectId: string
  archived: boolean
}) {
  if (archived) {
    return (
      <ConfirmDialog
        trigger={
          <Button variant="outline">
            <ArchiveRestoreIcon /> Restore
          </Button>
        }
        title="Restore this project?"
        description="It will show up in the active project list and can be edited again."
        confirmLabel="Restore project"
        successMessage="Project restored"
        destructive={false}
        onConfirm={() => setProjectArchived(orgSlug, { id: projectId, archived: false })}
      />
    )
  }
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <ArchiveIcon /> Archive
        </Button>
      }
      title="Archive this project?"
      description="Archived projects are read-only and hidden from the default lists. Their permits and history are kept, and an admin can restore it later."
      confirmLabel="Archive project"
      successMessage="Project archived"
      onConfirm={() => setProjectArchived(orgSlug, { id: projectId, archived: true })}
    />
  )
}
