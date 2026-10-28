import { InfoIcon } from "lucide-react"

export function DemoBanner() {
  return (
    <div
      data-print="hide"
      className="flex items-center justify-center gap-2 border-b bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <InfoIcon className="size-3.5 shrink-0" aria-hidden />
      Demo data. All names, addresses and permits are fictional.
    </div>
  )
}
