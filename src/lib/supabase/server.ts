import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { publicEnv } from "@/lib/env"

import type { Database } from "./database.types"

/**
 * User-scoped Supabase client for Server Components, Server Actions and route handlers.
 * Every query runs as the signed-in user, so RLS applies.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const env = publicEnv()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components cannot set cookies. The proxy refreshes the session instead.
          }
        },
      },
    }
  )
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
