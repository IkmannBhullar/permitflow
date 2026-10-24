import "server-only"

import { cache } from "react"

import { getUserId } from "@/lib/actions"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"

import type { OrgRole } from "./roles"

export type MyOrg = { id: string; slug: string; name: string; role: OrgRole; is_demo: boolean }

/** Every org the signed-in user belongs to, alphabetically. */
export const listMyOrgs = cache(async (): Promise<MyOrg[]> => {
  const userId = await getUserId()
  if (!userId) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations!inner(id, slug, name, is_demo)")
    .eq("user_id", userId)
  if (error) {
    reportError("listMyOrgs", error)
    return []
  }
  return data
    .map((m) => ({ ...m.organizations, role: m.role }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

export const getMyProfile = cache(async () => {
  const userId = await getUserId()
  if (!userId) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", userId)
    .maybeSingle()
  return data
})
