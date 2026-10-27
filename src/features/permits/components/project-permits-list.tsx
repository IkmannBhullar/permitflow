import { FileCheck2Icon } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import type { Tables } from "@/lib/supabase/database.types"

import { PERMIT_TYPE_LABELS } from "../status"
import { ExpiryLabel } from "./expiry-label"
import { PermitStatusBadge } from "./permit-status-badge"

export function ProjectPermitsList({
  permits,
  orgSlug,
  names,
  action,
}: {
  permits: Tables<"permits">[]
  orgSlug: string
  names: Record<string, string>
  action?: React.ReactNode
}) {
  if (permits.length === 0) {
    return (
      <EmptyState
        icon={FileCheck2Icon}
        title="No permits on this project"
        description={
          action ? "Add the first permit you need for this job." : "No permits have been added yet."
        }
        action={action}
      />
    )
  }
  return (
    <ul className="divide-y rounded-lg border">
      {permits.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 text-sm">
          <div className="min-w-0 flex-1">
            <Link href={`/app/${orgSlug}/permits/${p.id}`} className="font-medium hover:underline">
              {p.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {PERMIT_TYPE_LABELS[p.permit_type]} ·{" "}
              {p.assignee_id ? names[p.assignee_id] : "Unassigned"}
            </p>
          </div>
          <div className="hidden w-36 sm:block">
            <ExpiryLabel date={p.expires_at} />
          </div>
          <PermitStatusBadge status={p.status} />
        </li>
      ))}
    </ul>
  )
}
