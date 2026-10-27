"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ADMIN_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { publicEnv } from "@/lib/env"
import { reportError } from "@/lib/errors"

import { changeRoleSchema, inviteSchema, removeMemberSchema, revokeInviteSchema } from "./schemas"
import { newInviteToken } from "./tokens"

export const createInvite = orgAction(
  { name: "createInvite", schema: inviteSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { email, role }) => {
    const { data: existing, error: lookupError } = await supabase
      .from("organization_members")
      .select("user_id, profiles!inner(email)")
      .eq("org_id", org.id)
      .eq("profiles.email", email)
      .maybeSingle()
    if (lookupError) return fail(reportError("createInvite", lookupError))
    if (existing)
      return fail("That person is already a member.", {
        email: ["Already a member of this organization."],
      })

    // Re-inviting replaces any earlier pending link for the same address.
    const { error: revokeError } = await supabase
      .from("invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("org_id", org.id)
      .eq("email", email)
      .is("accepted_at", null)
      .is("revoked_at", null)
    if (revokeError) return fail(reportError("createInvite", revokeError))

    const { token, hash } = newInviteToken()
    const { error } = await supabase
      .from("invites")
      .insert({ org_id: org.id, email, role, token_hash: hash })
    if (error) return fail(reportError("createInvite", error))

    revalidatePath(`/app/${org.slug}/team`)
    return ok({ link: `${publicEnv().NEXT_PUBLIC_SITE_URL}/invite/${token}` })
  }
)

export const revokeInvite = orgAction(
  { name: "revokeInvite", schema: revokeInviteSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { id }) => {
    const { data, error } = await supabase
      .from("invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", org.id)
      .is("accepted_at", null)
      .select("id")
    if (error) return fail(reportError("revokeInvite", error))
    if (!data.length) return fail("That invite was already used or removed.")
    revalidatePath(`/app/${org.slug}/team`)
    return ok()
  }
)

export const changeMemberRole = orgAction(
  { name: "changeMemberRole", schema: changeRoleSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { userId, role }) => {
    const { data, error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("org_id", org.id)
      .eq("user_id", userId)
      .select("user_id")
    if (error) return fail(reportError("changeMemberRole", error))
    if (!data.length) return fail("We couldn't find that member.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const removeMember = orgAction(
  { name: "removeMember", schema: removeMemberSchema, roles: ADMIN_ROLES },
  async ({ supabase, org, userId: me }, { userId }) => {
    const { data, error } = await supabase
      .from("organization_members")
      .delete()
      .eq("org_id", org.id)
      .eq("user_id", userId)
      .select("user_id")
    if (error) return fail(reportError("removeMember", error))
    if (!data.length) return fail("We couldn't find that member.")
    if (userId === me) redirect("/app")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)
