import { Progress } from "@/components/ui/progress"

import type { Progress as ProgressValue } from "../progress"

export function ProjectProgress({
  progress,
  compact = false,
}: {
  progress: ProgressValue
  compact?: boolean
}) {
  const label =
    progress.total === 0
      ? "No permits yet"
      : `${progress.done} of ${progress.total} permits approved or closed`
  return (
    <div className="flex min-w-32 items-center gap-2" title={label}>
      <Progress value={progress.percent} aria-label={label} className={compact ? "h-1.5" : "h-2"} />
      <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {progress.percent}%
      </span>
      {compact ? null : <span className="sr-only">{label}</span>}
    </div>
  )
}
