"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { fail, invalid, ok, type ActionResult } from "@/lib/action-result"
import { getUserId, orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"

import { ADMIN_ROLES } from "./roles"
import { createOrgSchema, updateOrgSchema, type CreateOrgInput } from "./schemas"

const SLUG_TAKEN = "That URL is already taken. Try another."

export async function createOrganization(input: CreateOrgInput): Promise<ActionResult> {
  const parsed = createOrgSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  if (!(await getUserId())) return fail("Your session has expired. Please log in again.")

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  })
  if (error) {
    if (error.code === "23505") return fail(SLUG_TAKEN, { slug: [SLUG_TAKEN] })
    return fail(reportError("createOrganization", error))
  }
  redirect(`/app/${data.slug}/dashboard`)
}

export const updateOrganization = orgAction(
  { name: "updateOrganization", schema: updateOrgSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { name, slug }) => {
    const { error } = await supabase.from("organizations").update({ name, slug }).eq("id", org.id)
    if (error) {
      if (error.code === "23505") return fail(SLUG_TAKEN, { slug: [SLUG_TAKEN] })
      return fail(reportError("updateOrganization", error))
    }
    revalidatePath("/app", "layout")
    if (slug !== org.slug) redirect(`/app/${slug}/settings`)
    return ok()
  }
)
