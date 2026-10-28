"use client"

import { CheckCheckIcon, RefreshCwIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { markAllNotificationsRead, markNotificationRead, runDueNotificationsNow } from "../actions"

export function MarkAllReadButton({ orgSlug }: { orgSlug: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllNotificationsRead(orgSlug, {})
          if (result.ok) toast.success("All notifications marked read")
          else toast.error(result.error)
        })
      }
    >
      <CheckCheckIcon /> Mark all read
    </Button>
  )
}

export function MarkReadButton({ orgSlug, id }: { orgSlug: string; id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markNotificationRead(orgSlug, { id })
          if (!result.ok) toast.error(result.error)
        })
      }
    >
      Mark read
    </Button>
  )
}

export function RunDueCheckButton({ orgSlug }: { orgSlug: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await runDueNotificationsNow(orgSlug, {})
          if (!result.ok) return void toast.error(result.error)
          toast.success(
            result.data.created === 0
              ? "Checked due dates. No new reminders."
              : `Checked due dates. Sent ${result.data.created} new reminder${result.data.created === 1 ? "" : "s"}.`
          )
        })
      }
    >
      <RefreshCwIcon className={pending ? "animate-spin" : undefined} /> Check due dates now
    </Button>
  )
}
