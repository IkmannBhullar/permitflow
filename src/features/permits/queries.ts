import "server-only"

import { addDaysISO, todayISO } from "@/lib/dates"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

import { PAGE_SIZE, searchPattern, type PermitFilters } from "./filters"

export type PermitListRow = Tables<"permits"> & { project: { id: string; name: string } }

export async function listPermits(
  orgId: string,
  f: PermitFilters
): Promise<{ rows: PermitListRow[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from("permits")
    .select("*, project:projects!inner(id, name)", { count: "exact" })
    .eq("org_id", orgId)

  if (f.q) {
    const p = searchPattern(f.q)
    query = query.or(`name.ilike.${p},application_number.ilike.${p},jurisdiction.ilike.${p}`)
  }
  if (f.statuses.length) query = query.in("status", f.statuses)
  if (f.type) query = query.eq("permit_type", f.type)
  if (f.projectId) query = query.eq("project_id", f.projectId)
  if (f.assigneeId) query = query.eq("assignee_id", f.assigneeId)
  if (f.unassigned) query = query.is("assignee_id", null)
  if (f.expiringDays) {
    const today = todayISO()
    query = query.gte("expires_at", today).lte("expires_at", addDaysISO(today, f.expiringDays))
  }

  const from = (f.page - 1) * PAGE_SIZE
  const { data, error, count } = await query
    .order(f.sort, { ascending: f.dir === "asc", nullsFirst: false })
    .order("id")
    .range(from, from + PAGE_SIZE - 1)

  // Asking for a page past the end returns 416; treat it as an empty page.
  if (error?.code === "PGRST103") return { rows: [], total: count ?? 0 }
  if (error) throw new Error(reportError("listPermits", error))
  return { rows: data, total: count ?? 0 }
}

export async function listProjectPermits(
  orgId: string,
  projectId: string
): Promise<Tables<"permits">[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("permits")
    .select("*")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at")
  if (error) throw new Error(reportError("listProjectPermits", error))
  return data
}

export async function getPermit(orgId: string, permitId: string): Promise<PermitListRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("permits")
    .select("*, project:projects!inner(id, name)")
    .eq("org_id", orgId)
    .eq("id", permitId)
    .maybeSingle()
  if (error) {
    if (error.code === "22P02") return null
    throw new Error(reportError("getPermit", error))
  }
  return data
}
