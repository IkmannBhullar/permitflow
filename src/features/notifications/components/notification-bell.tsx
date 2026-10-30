"use client"

import { BellIcon, CheckCheckIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { markAllNotificationsRead, markNotificationRead } from "../actions"
import type { NotificationRow } from "../queries"
import { NotificationItem } from "./notification-item"

export function NotificationBell({
  orgSlug,
  items,
  unread,
}: {
  orgSlug: string
  items: NotificationRow[]
  unread: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const label = unread ? `Notifications, ${unread} unread` : "Notifications"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <span className="sr-only">{label}</span>
          <BellIcon aria-hidden />
          {unread ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unread ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await markAllNotificationsRead(orgSlug, {})
                  if (!result.ok) toast.error(result.error)
                })
              }
            >
              <CheckCheckIcon /> Mark all read
            </Button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2.5 text-left hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  )}
                  onClick={() => {
                    setOpen(false)
                    startTransition(async () => {
                      if (!n.read_at) await markNotificationRead(orgSlug, { id: n.id })
                      if (n.link) router.push(`/app/${orgSlug}/${n.link}`)
                    })
                  }}
                >
                  <NotificationItem notification={n} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t px-3 py-2 text-center">
          <Link
            href={`/app/${orgSlug}/notifications`}
            className="text-sm hover:underline"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
