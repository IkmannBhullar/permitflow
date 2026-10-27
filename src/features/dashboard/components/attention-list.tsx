import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  HourglassIcon,
  ListTodoIcon,
} from "lucide-react"
import Link from "next/link"

import type { AttentionItem } from "../aggregate"

const ICONS = {
  corrections: {
    icon: AlertTriangleIcon,
    className: "text-amber-600 dark:text-amber-400",
    label: "Corrections",
  },
  expiring: {
    icon: ClockIcon,
    className: "text-orange-600 dark:text-orange-400",
    label: "Expiring",
  },
  overdue_task: { icon: ListTodoIcon, className: "text-destructive", label: "Overdue" },
  stalled: {
    icon: HourglassIcon,
    className: "text-violet-600 dark:text-violet-400",
    label: "Stalled",
  },
} as const

export function AttentionList({ items, orgSlug }: { items: AttentionItem[]; orgSlug: string }) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <CheckCircle2Icon className="size-4 text-emerald-600" aria-hidden /> Nothing needs attention
        right now.
      </p>
    )
  }
  return (
    <ul className="-mr-2 max-h-96 divide-y overflow-y-auto pr-2">
      {items.map((item) => {
        const meta = ICONS[item.kind]
        return (
          <li key={`${item.kind}-${item.id}`}>
            <Link
              href={`/app/${orgSlug}/${item.href}`}
              className="flex items-start gap-3 py-2.5 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
            >
              <meta.icon
                className={`mt-0.5 size-4 shrink-0 ${meta.className}`}
                aria-label={meta.label}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
