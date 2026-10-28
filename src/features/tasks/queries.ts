import "server-only"

import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type TaskRow = Tables<"tasks"> & {
  permit: { id: string; name: string } | null
  project: { id: string; name: string }
}

export async function listTasks(
  orgId: string,
  scope: {
    projectId?: string
    permitId?: string
    assigneeId?: string
    openOnly?: boolean
    correctionsOnly?: boolean
    /** Open tasks due before this date ('YYYY-MM-DD'). */
    dueBefore?: string
  } = {}
): Promise<TaskRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("tasks")
    .select("*, permit:permits(id, name), project:projects!inner(id, name)")
    .eq("org_id", orgId)
  if (scope.projectId) query = query.eq("project_id", scope.projectId)
  if (scope.permitId) query = query.eq("permit_id", scope.permitId)
  if (scope.assigneeId) query = query.eq("assignee_id", scope.assigneeId)
  if (scope.openOnly || scope.dueBefore) query = query.neq("status", "done")
  if (scope.correctionsOnly) query = query.eq("is_correction", true)
  if (scope.dueBefore) query = query.lt("due_date", scope.dueBefore)
  // Open work first, soonest due first; finished work last.
  const { data, error } = await query
    .order("completed_at", { ascending: false, nullsFirst: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at")
  if (error) throw new Error(reportError("listTasks", error))
  return data
}

/** Permits waiting on corrections, with how many open correction tasks each has. */
export async function listCorrectionPermits(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("permits")
    .select(
      "id, name, status_changed_at, assignee_id, project:projects!inner(id, name), tasks(id, status, is_correction)"
    )
    .eq("org_id", orgId)
    .eq("status", "corrections_required")
    .order("status_changed_at")
  if (error) throw new Error(reportError("listCorrectionPermits", error))
  return data.map(({ tasks, ...p }) => ({
    ...p,
    openCorrections: tasks.filter((t) => t.is_correction && t.status !== "done").length,
    doneCorrections: tasks.filter((t) => t.is_correction && t.status === "done").length,
  }))
}
