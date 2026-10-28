import "server-only"

import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type NotificationRow = Pick<
  Tables<"notifications">,
  "id" | "type" | "title" | "body" | "link" | "read_at" | "created_at"
>

export async function listNotifications(
  orgId: string,
  userId: string,
  { limit = 50, unreadOnly = false } = {}
): Promise<{ items: NotificationRow[]; unread: number }> {
  const supabase = await createClient()
  let list = supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (unreadOnly) list = list.is("read_at", null)
  const count = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .is("read_at", null)
  const [items, unread] = await Promise.all([list, count])
  if (items.error || unread.error) {
    reportError("listNotifications", items.error ?? unread.error)
    return { items: [], unread: 0 }
  }
  return { items: items.data, unread: unread.count ?? 0 }
}
