import { describe, expect, it } from "vitest"

import { safeNext } from "./redirects"

describe("safeNext", () => {
  it.each([
    ["/app/acme/permits?status=approved", "/app/acme/permits?status=approved"],
    ["/invite/abc", "/invite/abc"],
  ])("keeps relative path %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "", null, undefined])(
    "rejects %s",
    (input) => {
      expect(safeNext(input)).toBe("/app")
    }
  )
})
