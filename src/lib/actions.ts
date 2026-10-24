import "server-only"

import { unstable_rethrow } from "next/navigation"
import { z } from "zod"

import { reportError } from "@/lib/errors"
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

export type OrgRole = Database["public"]["Enums"]["org_role"]

export type FieldErrors = Record<string, string[] | undefined>

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: FieldErrors }

export function ok<T = undefined>(data?: T): ActionResult<T> {
  return { ok: true, data: data as T }
}

export function fail(
  error: string,
  fieldErrors?: FieldErrors
): { ok: false; error: string; fieldErrors?: FieldErrors } {
  return { ok: false, error, fieldErrors }
}

export function invalid(error: z.ZodError) {
  return fail(
    "Please fix the highlighted fields.",
    z.flattenError(error).fieldErrors as FieldErrors
  )
}

export const EDIT_ROLES: OrgRole[] = ["admin", "project_manager"]
export const ADMIN_ROLES: OrgRole[] = ["admin"]

export type OrgContext = {
  supabase: SupabaseServerClient
  userId: string
  org: { id: string; slug: string; name: string }
  role: OrgRole
}

/**
 * Resolves the caller and their membership in the org identified by `orgSlug`.
 * Returns null when signed out or not a member. RLS means a non-member simply
 * cannot see the org row, so this cannot be tricked into another tenant.
 */
export async function getOrgContext(orgSlug: string): Promise<OrgContext | null> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return null

  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations!inner(id, slug, name)")
    .eq("user_id", userId)
    .eq("organizations.slug", orgSlug)
    .maybeSingle()

  if (error) {
    reportError("getOrgContext", error)
    return null
  }
  if (!data) return null
  return { supabase, userId, org: data.organizations, role: data.role }
}

const ROLE_DENIED: Record<string, string> = {
  admin: "Only admins can do that.",
  editor: "Viewers have read-only access. Ask an admin for edit access.",
}

/**
 * Wraps a Server Action that operates inside an org:
 * validates input with Zod, resolves the org and the caller's role, rejects roles
 * that may not perform it (friendly error; RLS is still the real guard), and turns
 * any thrown error into a safe message.
 */
export function orgAction<Schema extends z.ZodType, T>(
  options: { schema: Schema; roles: OrgRole[]; name: string },
  handler: (ctx: OrgContext, input: z.output<Schema>) => Promise<ActionResult<T>>
) {
  return async (orgSlug: string, rawInput: z.input<Schema>): Promise<ActionResult<T>> => {
    try {
      const parsed = options.schema.safeParse(rawInput)
      if (!parsed.success) return invalid(parsed.error)

      const ctx = await getOrgContext(orgSlug)
      if (!ctx) return fail("You don't have access to this organization.")
      if (!options.roles.includes(ctx.role)) {
        return fail(options.roles.length === 1 ? ROLE_DENIED.admin : ROLE_DENIED.editor)
      }
      return await handler(ctx, parsed.data)
    } catch (error) {
      // Let Next.js control-flow errors (redirect, notFound) propagate.
      unstable_rethrow(error)
      return fail(reportError(options.name, error))
    }
  }
}
