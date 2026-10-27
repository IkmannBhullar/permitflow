"use client"

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import type { SelectOption } from "@/components/form/select-field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Tables } from "@/lib/supabase/database.types"

import { deleteTask } from "../actions"
import { TaskFormDialog } from "./task-form-dialog"

export function TaskRowActions({
  orgSlug,
  task,
  members,
  permits,
  canDelete,
}: {
  orgSlug: string
  task: Tables<"tasks">
  members: SelectOption[]
  permits: SelectOption[]
  canDelete: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for task: ${task.title}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <TaskFormDialog
            orgSlug={orgSlug}
            projectId={task.project_id}
            members={members}
            permits={permits}
            task={task}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
            }
          />
          {canDelete ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{task.title}” will be removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                const result = await deleteTask(orgSlug, { id: task.id })
                if (result.ok) toast.success("Task deleted")
                else toast.error(result.error)
              }}
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
