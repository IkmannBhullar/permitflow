import { Badge } from "@/components/ui/badge"

import { PROJECT_STATUS_LABELS, type ProjectStatus } from "../constants"

const VARIANT: Record<ProjectStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  active: "default",
  on_hold: "secondary",
  completed: "outline",
  archived: "outline",
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={VARIANT[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>
}
