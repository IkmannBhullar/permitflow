import "server-only"

import { createClient } from "@supabase/supabase-js"

import { publicEnv } from "@/lib/env"
import { serverEnv } from "@/lib/env.server"

import type { Database } from "./database.types"

/**
 * Service-role client. BYPASSES RLS. Only the cron route may import this module
 * (enforced by ESLint `no-restricted-imports`). Never pass its results to a user
 * without scoping them yourself.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
