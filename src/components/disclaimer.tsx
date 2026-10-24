import { cn } from "@/lib/utils"

/** Required on every surface: PermitFlow is a tracker, not a filing or verification service. */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      PermitFlow tracks permits. It does not submit applications to, or verify approvals with,
      government agencies.
    </p>
  )
}
