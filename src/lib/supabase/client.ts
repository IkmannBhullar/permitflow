import { createBrowserClient } from "@supabase/ssr"

import { publicEnv } from "@/lib/env"

import type { Database } from "./database.types"

/** Browser client. Used only where the browser must talk to Supabase directly (file uploads). */
export function createClient() {
  const env = publicEnv()
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
