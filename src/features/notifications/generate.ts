import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { todayISO } from "@/lib/dates"
import type { Database } from "@/lib/supabase/database.types"

import { computeDueNotifications, type DuePermit, type DueTask } from "./due"

/**
 * Creates today's time-based notifications (expiring permits, overdue tasks).
 * Idempotent: rows are inserted with `on conflict (dedupe_key) do nothing`.
 * Called from the cron route with the service-role client, optionally scoped to one org.
 */
export async function generateDueNotifications(
  db: SupabaseClient<Database>,
  { orgId, today = todayISO() }: { orgId?: string; today?: string } = {}
) {
  let permitsQuery = db
    .from("permits")
    .select(
      "id, org_id, name, status, expires_at, assignee_id, project:projects!inner(name, manager_id)"
    )
    .not("expires_at", "is", null)
  let tasksQuery = db
    .from("tasks")
    .select("id, org_id, title, status, due_date, assignee_id, permit_id, project_id")
    .neq("status", "done")
    .lt("due_date", today)
  if (orgId) {
    permitsQuery = permitsQuery.eq("org_id", orgId)
    tasksQuery = tasksQuery.eq("org_id", orgId)
  }
  const [permits, tasks] = await Promise.all([permitsQuery, tasksQuery])
  if (permits.error) throw permits.error
  if (tasks.error) throw tasks.error

  const due = computeDueNotifications(permits.data as DuePermit[], tasks.data as DueTask[], today)
  let created = 0
  for (let i = 0; i < due.length; i += 500) {
    const { data, error } = await db
      .from("notifications")
      .upsert(due.slice(i, i + 500), { onConflict: "dedupe_key", ignoreDuplicates: true })
      .select("id")
    if (error) throw error
    created += data.length
  }
  return { candidates: due.length, created }
}
