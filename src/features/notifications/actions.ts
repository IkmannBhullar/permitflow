"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { ADMIN_ROLES, ORG_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { serverEnv } from "@/lib/env.server"
import { reportError } from "@/lib/errors"

export const markNotificationRead = orgAction(
  { name: "markNotificationRead", schema: z.object({ id: z.uuid() }), roles: ORG_ROLES },
  async ({ supabase, org, userId }, { id }) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", org.id)
      .eq("user_id", userId)
      .is("read_at", null)
    if (error) return fail(reportError("markNotificationRead", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const markAllNotificationsRead = orgAction(
  { name: "markAllNotificationsRead", schema: z.object({}), roles: ORG_ROLES },
  async ({ supabase, org, userId }) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("org_id", org.id)
      .eq("user_id", userId)
      .is("read_at", null)
    if (error) return fail(reportError("markAllNotificationsRead", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

/**
 * Admin "Check now": calls the cron route for this org only. The secret stays on the server,
 * and the service-role client stays confined to the cron route.
 */
export const runDueNotificationsNow = orgAction(
  { name: "runDueNotificationsNow", schema: z.object({}), roles: ADMIN_ROLES },
  async ({ org }) => {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host")
    const proto =
      h.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https")
    if (!host) return fail("Couldn't determine this site's address.")
    const response = await fetch(`${proto}://${host}/api/cron/due-notifications?org=${org.id}`, {
      headers: { authorization: `Bearer ${serverEnv.cronSecret()}` },
      cache: "no-store",
    })
    const body = (await response.json().catch(() => null)) as {
      ok?: boolean
      created?: number
    } | null
    if (!response.ok || !body?.ok)
      return fail(
        reportError(
          "runDueNotificationsNow",
          body ?? response.status,
          "The check failed. Try again."
        )
      )
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok({ created: body.created ?? 0 })
  }
)
