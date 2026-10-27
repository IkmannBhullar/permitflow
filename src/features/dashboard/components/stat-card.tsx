import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string
  value: number
  icon: LucideIcon
  href?: string
  tone?: "default" | "warning" | "danger"
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" aria-hidden />
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          value > 0 && tone === "warning" && "text-amber-700 dark:text-amber-400",
          value > 0 && tone === "danger" && "text-destructive"
        )}
      >
        {value}
      </p>
    </>
  )
  const className = "block rounded-lg border bg-card p-4"
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
