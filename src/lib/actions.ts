import "server-only"

import { unstable_rethrow } from "next/navigation"
import { cache } from "react"
import type { z } from "zod"

import type { OrgRole } from "@/features/orgs/roles"
import { fail, invalid, type ActionResult } from "@/lib/action-result"
import { reportError } from "@/lib/errors"
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server"

export type OrgContext = {
  supabase: SupabaseServerClient
  userId: string
  org: { id: string; slug: string; name: string; is_demo: boolean }
  role: OrgRole
}

/** The signed-in user's id, verified from the session JWT, or null. */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims?.sub ?? null
})

/**
 * Resolves the caller and their membership in the org identified by `orgSlug`.
 * Returns null when signed out or not a member. RLS hides orgs the caller does not
 * belong to, so a guessed slug resolves to nothing. Cached per request.
 */
export const getOrgContext = cache(async (orgSlug: string): Promise<OrgContext | null> => {
  const userId = await getUserId()
  if (!userId) return null
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations!inner(id, slug, name, is_demo)")
    .eq("user_id", userId)
    .eq("organizations.slug", orgSlug)
    .maybeSingle()

  if (error) {
    reportError("getOrgContext", error)
    return null
  }
  if (!data) return null
  return { supabase, userId, org: data.organizations, role: data.role }
})

/**
 * Wraps a Server Action that operates inside an org: validates input with Zod, resolves
 * the org and the caller's role, rejects roles that may not perform it (a friendly error;
 * RLS is still the real guard), and turns anything thrown into a safe message.
 */
export function orgAction<Schema extends z.ZodType, T>(
  options: { name: string; schema: Schema; roles: OrgRole[] },
  handler: (ctx: OrgContext, input: z.output<Schema>) => Promise<ActionResult<T>>
) {
  return async (orgSlug: string, rawInput: z.input<Schema>): Promise<ActionResult<T>> => {
    try {
      const parsed = options.schema.safeParse(rawInput)
      if (!parsed.success) return invalid(parsed.error)

      const ctx = await getOrgContext(orgSlug)
      if (!ctx) return fail("You don't have access to this organization.")
      if (!options.roles.includes(ctx.role)) {
        return fail(
          options.roles.length === 1 && options.roles[0] === "admin"
            ? "Only admins can do that."
            : "Viewers have read-only access. Ask an admin for edit access."
        )
      }
      return await handler(ctx, parsed.data)
    } catch (error) {
      // Let Next.js control-flow errors (redirect, notFound) propagate.
      unstable_rethrow(error)
      return fail(reportError(options.name, error))
    }
  }
}
