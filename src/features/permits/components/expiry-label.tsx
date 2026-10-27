import { daysBetween, formatDate, relativeDays, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"

/** Expiration date with urgency color: red when past or within 7 days, amber within 30. */
export function ExpiryLabel({ date, today = todayISO() }: { date: string | null; today?: string }) {
  if (!date) return <span className="text-muted-foreground">—</span>
  const days = daysBetween(today, date)
  return (
    <span className="whitespace-nowrap">
      {formatDate(date)}
      <span
        className={cn(
          "block text-xs",
          days < 0 || days <= 7
            ? "text-destructive"
            : days <= 30
              ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground"
        )}
      >
        {days < 0 ? `expired ${relativeDays(date, today)}` : `expires ${relativeDays(date, today)}`}
      </span>
    </span>
  )
}
