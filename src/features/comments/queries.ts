import "server-only"

import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

import type { CommentEntity } from "./schemas"

export type CommentRow = Tables<"comments"> & { author: { full_name: string } | null }

export async function listComments(
  orgId: string,
  entityType: CommentEntity,
  entityId: string
): Promise<CommentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles(full_name)")
    .eq("org_id", orgId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at")
  if (error) throw new Error(reportError("listComments", error))
  return data
}
