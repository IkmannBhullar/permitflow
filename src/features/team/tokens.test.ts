import { createHash } from "node:crypto"

import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { hashInviteToken, newInviteToken } = await import("./tokens")

describe("invite tokens", () => {
  it("are long, URL-safe and unique", () => {
    const a = newInviteToken()
    const b = newInviteToken()
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a.token).not.toBe(b.token)
  })

  it("store only a sha256 hex digest", () => {
    const { token, hash } = newInviteToken()
    expect(hash).toBe(createHash("sha256").update(token).digest("hex"))
    expect(hash).not.toContain(token)
    expect(hashInviteToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )
  })
})
