import "server-only"

import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"

import type { DashPermit, DashTask } from "./aggregate"

/** Raw rows for the dashboard. Aggregation happens in ./aggregate (pure, unit tested). */
export async function loadDashboardData(orgId: string) {
  const supabase = await createClient()
  const [projects, permits, tasks] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active"),
    supabase
      .from("permits")
      .select("id, name, status, expires_at, status_changed_at, project:projects!inner(id, name)")
      .eq("org_id", orgId),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, is_correction, permit_id, project_id")
      .eq("org_id", orgId)
      .neq("status", "done"),
  ])
  for (const result of [projects, permits, tasks]) {
    if (result.error) throw new Error(reportError("loadDashboardData", result.error))
  }
  return {
    activeProjects: projects.count ?? 0,
    permits: (permits.data ?? []) as DashPermit[],
    openTasks: (tasks.data ?? []) as DashTask[],
  }
}
