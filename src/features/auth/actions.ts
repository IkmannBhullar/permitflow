"use server"

import { redirect } from "next/navigation"

import { fail, invalid, ok, type ActionResult } from "@/lib/action-result"
import { publicEnv } from "@/lib/env"
import { reportError } from "@/lib/errors"
import { safeNext } from "@/lib/redirects"
import { createClient } from "@/lib/supabase/server"

import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "./schemas"

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Confirm your email address first. Check your inbox for the link.",
  user_already_exists: "An account with this email already exists. Log in instead.",
  email_exists: "An account with this email already exists. Log in instead.",
  weak_password: "Choose a stronger password.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  over_email_send_rate_limit: "Too many sign-up emails sent. Wait a few minutes and try again.",
}

function authError(context: string, error: { code?: string; message: string }) {
  if (error.code && AUTH_MESSAGES[error.code]) return fail(AUTH_MESSAGES[error.code])
  return fail(reportError(context, error))
}

export async function login(input: LoginInput, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return authError("login", error)

  redirect(safeNext(next))
}

export async function signup(
  input: SignupInput,
  next?: string
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  const destination = safeNext(next, "/onboarding")
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?next=${encodeURIComponent(destination)}`,
    },
  })
  if (error) return authError("signup", error)

  // With email confirmation enabled there is no session yet.
  if (!data.session) return ok({ needsConfirmation: true })
  redirect(destination)
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
