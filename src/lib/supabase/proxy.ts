import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { publicEnv } from "@/lib/env"

import type { Database } from "./database.types"

const PROTECTED_PREFIXES = ["/app", "/onboarding"]
const AUTH_PAGES = ["/login", "/signup"]

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Refreshes the Supabase session cookie on every request and gates routes:
 * signed-out visitors are sent to /login, signed-in users skip the auth pages.
 * Org membership is checked later, in the org layout.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const env = publicEnv()

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
        },
      },
    }
  )

  // getClaims() verifies the JWT; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)
  const { pathname, search } = request.nextUrl

  if (!signedIn && matches(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("next", `${pathname}${search}`)
    return redirectWithCookies(url, response)
  }

  if (signedIn && matches(pathname, AUTH_PAGES)) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    url.search = ""
    return redirectWithCookies(url, response)
  }

  return response
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url)
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}
