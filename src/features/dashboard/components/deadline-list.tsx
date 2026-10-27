import { CalendarCheckIcon, FileClockIcon, ListTodoIcon } from "lucide-react"
import Link from "next/link"

import { formatDate, relativeDays } from "@/lib/dates"

import type { Deadline } from "../aggregate"

export function DeadlineList({
  items,
  orgSlug,
  today,
}: {
  items: Deadline[]
  orgSlug: string
  today: string
}) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <CalendarCheckIcon className="size-4" aria-hidden /> No deadlines in the next two weeks.
      </p>
    )
  }
  return (
    <ul className="divide-y">
      {items.map((d) => {
        const Icon = d.kind === "permit_expires" ? FileClockIcon : ListTodoIcon
        return (
          <li key={`${d.kind}-${d.id}`}>
            <Link
              href={`/app/${orgSlug}/${d.href}`}
              className="flex items-center gap-3 py-2.5 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-label={d.kind === "permit_expires" ? "Permit expires" : "Task due"}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{d.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground" title={formatDate(d.date)}>
                {d.kind === "permit_expires" ? "expires" : "due"} {relativeDays(d.date, today)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
