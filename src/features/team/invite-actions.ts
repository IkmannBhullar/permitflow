"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { fail, type ActionResult } from "@/lib/action-result"
import { getUserId } from "@/lib/actions"
import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"

const tokenSchema = z.string().min(20).max(200)

export async function acceptInvite(token: string): Promise<ActionResult> {
  const parsed = tokenSchema.safeParse(token)
  if (!parsed.success) return fail("This invite link is invalid.")
  if (!(await getUserId())) return fail("Log in to accept this invite.")

  const supabase = await createClient()
  const { data: slug, error } = await supabase.rpc("accept_invite", { p_token: parsed.data })
  if (error) return fail(reportError("acceptInvite", error))
  redirect(`/app/${slug}/dashboard`)
}
