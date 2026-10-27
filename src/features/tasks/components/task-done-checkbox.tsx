"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"

import { setTaskDone } from "../actions"

export function TaskDoneCheckbox({
  orgSlug,
  taskId,
  title,
  done,
  disabled,
}: {
  orgSlug: string
  taskId: string
  title: string
  done: boolean
  disabled?: boolean
}) {
  const [, startTransition] = useTransition()
  const [optimisticDone, setOptimisticDone] = useOptimistic(done)

  return (
    <Checkbox
      checked={optimisticDone}
      disabled={disabled}
      aria-label={`${optimisticDone ? "Reopen" : "Complete"} task: ${title}`}
      onCheckedChange={(value) => {
        startTransition(async () => {
          setOptimisticDone(value === true)
          const result = await setTaskDone(orgSlug, { id: taskId, done: value === true })
          if (!result.ok) toast.error(result.error)
        })
      }}
    />
  )
}
