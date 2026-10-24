import { cn } from "@/lib/utils"

import { PERMIT_STATUS_META, statusColor, type PermitStatus } from "../status"

export function PermitStatusBadge({
  status,
  className,
}: {
  status: PermitStatus
  className?: string
}) {
  const meta = PERMIT_STATUS_META[status]
  return (
    <span
      className={cn("status-badge", className)}
      style={{ "--tone": statusColor(status) } as React.CSSProperties}
      title={meta.description}
    >
      <span className="status-dot" aria-hidden />
      {meta.label}
    </span>
  )
}
