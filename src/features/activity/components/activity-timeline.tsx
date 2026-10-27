import { HistoryIcon } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDateTime, timeAgo } from "@/lib/dates"
import { initials } from "@/lib/initials"

import { activityHref, describeActivity, type ActivityRow } from "../describe"

export function ActivityTimeline({
  items,
  orgSlug,
  names,
  linkItems = false,
}: {
  items: ActivityRow[]
  orgSlug: string
  /** user id -> display name, for assignee names inside metadata */
  names: Record<string, string>
  /** Link each entry to its record (for org- and project-wide feeds). */
  linkItems?: boolean
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="No activity yet"
        description="Changes made by your team will appear here."
      />
    )
  }
  const nameOf = (id: string) => names[id] ?? "a former member"

  return (
    <ol className="space-y-4">
      {items.map((item) => {
        const actor = item.actor?.full_name ?? "System"
        const text = describeActivity(item, nameOf)
        const href = linkItems ? activityHref(item) : null
        return (
          <li key={item.id} className="flex gap-3">
            <Avatar className="mt-0.5 size-6">
              <AvatarFallback className="text-[10px]">{initials(actor)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-pretty">
                <span className="font-medium">{actor}</span>{" "}
                {href ? (
                  <Link
                    href={`/app/${orgSlug}/${href}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {text}
                  </Link>
                ) : (
                  text
                )}
              </p>
              <time
                dateTime={item.created_at}
                title={formatDateTime(item.created_at)}
                className="text-xs text-muted-foreground"
              >
                {timeAgo(item.created_at)}
              </time>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
