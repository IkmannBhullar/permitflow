import "server-only"

import { cache } from "react"

import type { OrgRole } from "@/features/orgs/roles"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"

export type Member = {
  user_id: string
  role: OrgRole
  full_name: string
  email: string
  created_at: string
}

/** Everyone in the org, alphabetically. Used for assignee pickers and the team page. */
export const listMembers = cache(async (orgId: string): Promise<Member[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at, profiles!inner(full_name, email)")
    .eq("org_id", orgId)
  if (error) {
    reportError("listMembers", error)
    return []
  }
  return data
    .map((m) => ({
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      full_name: m.profiles.full_name,
      email: m.profiles.email,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
})

export const memberOptions = (members: Member[]) =>
  members.map((m) => ({ value: m.user_id, label: m.full_name || m.email }))

export const memberNames = (members: Member[]): Record<string, string> =>
  Object.fromEntries(members.map((m) => [m.user_id, m.full_name || m.email]))
