import "server-only"

import type { PermitStatus } from "@/features/permits/status"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

import { projectProgress, type Progress } from "./progress"

export type ProjectRow = Tables<"projects"> & { progress: Progress }

function withProgress(p: Tables<"projects"> & { permits: { status: PermitStatus }[] }): ProjectRow {
  const { permits, ...project } = p
  return { ...project, progress: projectProgress(permits.map((x) => x.status)) }
}

export async function listProjects(
  orgId: string,
  { archived = false } = {}
): Promise<ProjectRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("projects")
    .select("*, permits(status)")
    .eq("org_id", orgId)
    .order("name")
  query = archived ? query.eq("status", "archived") : query.neq("status", "archived")
  const { data, error } = await query
  if (error) throw new Error(reportError("listProjects", error))
  return data.map(withProgress)
}

export async function getProject(orgId: string, projectId: string): Promise<ProjectRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*, permits(status)")
    .eq("org_id", orgId)
    .eq("id", projectId)
    .maybeSingle()
  if (error) {
    // An invalid uuid in the URL is a 404, not a crash.
    if (error.code === "22P02") return null
    throw new Error(reportError("getProject", error))
  }
  return data ? withProgress(data) : null
}

/** Lightweight id/name list for pickers (permit form, filters). */
export async function listProjectOptions(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("org_id", orgId)
    .order("name")
  if (error) throw new Error(reportError("listProjectOptions", error))
  return data
}
