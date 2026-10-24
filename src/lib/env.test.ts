import { describe, expect, it } from "vitest"

import { parsePublicEnv } from "./env"

describe("parsePublicEnv", () => {
  it("accepts a complete environment and defaults the site URL", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    })
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000")
  })

  it("names the missing variables without echoing values", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "secret-ish" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/
    )
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "secret-ish" })).not.toThrow(
      /secret-ish/
    )
  })
})
