import "server-only"

import type { Database } from "@/lib/supabase/database.types"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"

import type { ActivityRow } from "./describe"

type EntityType = Database["public"]["Enums"]["entity_type"]

export async function listActivity(
  orgId: string,
  scope: { projectId?: string; entity?: { type: EntityType; id: string } } = {},
  limit = 30
): Promise<ActivityRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("activity_log")
    .select("*, actor:profiles(full_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit)
  if (scope.projectId) query = query.eq("project_id", scope.projectId)
  if (scope.entity)
    query = query.eq("entity_type", scope.entity.type).eq("entity_id", scope.entity.id)
  const { data, error } = await query
  if (error) throw new Error(reportError("listActivity", error))
  return data
}
