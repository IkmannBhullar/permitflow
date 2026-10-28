import {
  AlarmClockIcon,
  ArrowRightLeftIcon,
  ClockIcon,
  ListTodoIcon,
  UserPlusIcon,
} from "lucide-react"

import { timeAgo } from "@/lib/dates"
import { cn } from "@/lib/utils"

import type { NotificationRow } from "../queries"

const ICONS: Record<string, typeof ClockIcon> = {
  permit_expiring: ClockIcon,
  task_overdue: AlarmClockIcon,
  task_assigned: ListTodoIcon,
  permit_assigned: UserPlusIcon,
  permit_status_changed: ArrowRightLeftIcon,
}

export function NotificationItem({ notification: n }: { notification: NotificationRow }) {
  const Icon = ICONS[n.type] ?? ClockIcon
  const unread = !n.read_at
  return (
    <span className="flex gap-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          unread ? "text-foreground" : "text-muted-foreground"
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread ? "font-medium" : "text-muted-foreground")}>
          {n.title}
          {unread ? <span className="sr-only"> (unread)</span> : null}
        </span>
        {n.body ? (
          <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
        ) : null}
        <span className="block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
      </span>
      {unread ? (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600" aria-hidden />
      ) : null}
    </span>
  )
}
