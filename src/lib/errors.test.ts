import { describe, expect, it } from "vitest"

import { GENERIC_ERROR, toSafeMessage } from "./errors"

describe("toSafeMessage", () => {
  it("maps known raised exceptions by message", () => {
    expect(toSafeMessage({ code: "P0001", message: "last_admin" })).toMatch(/at least one admin/)
  })

  it("maps Postgres error codes", () => {
    expect(toSafeMessage({ code: "42501", message: "new row violates row-level security" })).toBe(
      "You don't have permission to do that."
    )
  })

  it("never leaks unknown database text", () => {
    const message = toSafeMessage({ code: "XX000", message: 'relation "secret_table" exploded' })
    expect(message).toBe(GENERIC_ERROR)
  })

  it("handles missing errors", () => {
    expect(toSafeMessage(null, "fallback")).toBe("fallback")
  })
})
