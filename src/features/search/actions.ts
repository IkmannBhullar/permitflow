"use server"

import { z } from "zod"

import { ORG_ROLES } from "@/features/orgs/roles"
import { searchPattern } from "@/features/permits/filters"
import type { PermitStatus } from "@/features/permits/status"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"

export type SearchResults = {
  projects: { id: string; name: string; detail: string }[]
  permits: { id: string; name: string; detail: string; status: PermitStatus }[]
}

/** Command-K search across the caller's org (RLS-scoped, read-only). */
export const searchOrg = orgAction(
  {
    name: "searchOrg",
    schema: z.object({ q: z.string().trim().min(2).max(100) }),
    roles: ORG_ROLES,
  },
  async ({ supabase, org }, { q }) => {
    const p = searchPattern(q)
    const [projects, permits] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, address, city")
        .eq("org_id", org.id)
        .or(`name.ilike.${p},address.ilike.${p},city.ilike.${p}`)
        .order("name")
        .limit(6),
      supabase
        .from("permits")
        .select("id, name, status, application_number, project:projects!inner(name)")
        .eq("org_id", org.id)
        .or(`name.ilike.${p},application_number.ilike.${p},jurisdiction.ilike.${p}`)
        .order("updated_at", { ascending: false })
        .limit(8),
    ])
    if (projects.error || permits.error)
      return fail(reportError("searchOrg", projects.error ?? permits.error))
    return ok<SearchResults>({
      projects: projects.data.map((x) => ({
        id: x.id,
        name: x.name,
        detail: [x.address, x.city].filter(Boolean).join(", "),
      })),
      permits: permits.data.map((x) => ({
        id: x.id,
        name: x.name,
        status: x.status,
        detail: [x.application_number, x.project.name].filter(Boolean).join(" · "),
      })),
    })
  }
)
