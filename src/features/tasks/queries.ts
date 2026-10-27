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
  scope: { projectId?: string; permitId?: string; assigneeId?: string; openOnly?: boolean } = {}
): Promise<TaskRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("tasks")
    .select("*, permit:permits(id, name), project:projects!inner(id, name)")
    .eq("org_id", orgId)
  if (scope.projectId) query = query.eq("project_id", scope.projectId)
  if (scope.permitId) query = query.eq("permit_id", scope.permitId)
  if (scope.assigneeId) query = query.eq("assignee_id", scope.assigneeId)
  if (scope.openOnly) query = query.neq("status", "done")
  // Open work first, soonest due first; finished work last.
  const { data, error } = await query
    .order("completed_at", { ascending: false, nullsFirst: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at")
  if (error) throw new Error(reportError("listTasks", error))
  return data
}
