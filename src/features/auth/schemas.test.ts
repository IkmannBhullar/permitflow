import { describe, expect, it } from "vitest"

import { loginSchema, signupSchema } from "./schemas"

describe("auth schemas", () => {
  it("normalizes email casing and whitespace", () => {
    const parsed = loginSchema.parse({ email: "  Pat@Example.COM ", password: "x" })
    expect(parsed.email).toBe("pat@example.com")
  })

  it("requires 8+ character passwords on signup", () => {
    const result = signupSchema.safeParse({
      fullName: "Pat",
      email: "pat@example.com",
      password: "short",
    })
    expect(result.success).toBe(false)
  })

  it("rejects blank names", () => {
    const result = signupSchema.safeParse({
      fullName: "   ",
      email: "pat@example.com",
      password: "long-enough",
    })
    expect(result.success).toBe(false)
  })
})
