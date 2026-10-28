import "server-only"

import type { SupabaseServerClient } from "@/lib/supabase/server"

import type { ReportData, ReportPermit, ReportTask } from "./definitions"

/** Raw org data for reports, read with the user's client so RLS applies (CSV exports included). */
export async function loadReportData(
  supabase: SupabaseServerClient,
  orgId: string
): Promise<ReportData> {
  const [permits, projects, tasks] = await Promise.all([
    supabase
      .from("permits")
      .select(
        "id, name, status, permit_type, application_number, jurisdiction, submitted_at, expires_at, status_changed_at, assignee_id, project:projects!inner(id, name)"
      )
      .eq("org_id", orgId),
    supabase.from("projects").select("id, name, status, city, manager_id").eq("org_id", orgId),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, is_correction, permit_id, assignee_id")
      .eq("org_id", orgId)
      .eq("is_correction", true),
  ])
  for (const r of [permits, projects, tasks]) if (r.error) throw r.error
  return {
    permits: (permits.data ?? []) as ReportPermit[],
    projects: projects.data ?? [],
    tasks: (tasks.data ?? []) as ReportTask[],
  }
}
