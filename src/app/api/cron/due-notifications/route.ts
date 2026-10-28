import { createHash, timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { generateDueNotifications } from "@/features/notifications/generate"
import { serverEnv } from "@/lib/env.server"
import { reportError } from "@/lib/errors"
import { createAdminClient } from "@/lib/supabase/admin"

/** Constant-time comparison of two strings (hashed first so lengths always match). */
function safeEqual(a: string, b: string) {
  const digest = (s: string) => createHash("sha256").update(s).digest()
  return timingSafeEqual(digest(a), digest(b))
}

/**
 * Daily job (Vercel Cron, see vercel.json) that creates expiring-permit and overdue-task
 * notifications. Authenticated with `Authorization: Bearer $CRON_SECRET`. `?org=<id>` limits
 * it to one org; the admin "Check now" button uses that.
 */
export async function GET(request: NextRequest) {
  let secret: string
  try {
    secret = serverEnv.cronSecret()
  } catch {
    return NextResponse.json({ ok: false, error: "Cron is not configured." }, { status: 503 })
  }
  if (!safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const org = request.nextUrl.searchParams.get("org")
  const orgId = org ? z.uuid().safeParse(org).data : undefined
  if (org && !orgId) return NextResponse.json({ ok: false, error: "Invalid org" }, { status: 400 })

  try {
    const result = await generateDueNotifications(createAdminClient(), { orgId })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    reportError("cron:due-notifications", error)
    return NextResponse.json(
      { ok: false, error: "Failed to generate notifications." },
      { status: 500 }
    )
  }
}
