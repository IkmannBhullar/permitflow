"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { ActionResult } from "@/lib/action-result"

/** Confirmation for destructive actions. Runs `onConfirm` and toasts its result. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  successMessage,
  destructive = true,
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  successMessage: string
  destructive?: boolean
  onConfirm: () => Promise<ActionResult<unknown> | void>
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              startTransition(async () => {
                const result = await onConfirm()
                if (result && !result.ok) {
                  toast.error(result.error)
                  return
                }
                toast.success(successMessage)
                setOpen(false)
              })
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
