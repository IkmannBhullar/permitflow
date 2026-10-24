import { describe, expect, it } from "vitest"

import { SLUG_PATTERN, slugify } from "./slug"

describe("slugify", () => {
  it.each([
    ["Cascade Ridge Builders", "cascade-ridge-builders"],
    ["  Smith & Sons, LLC ", "smith-and-sons-llc"],
    ["Bâtiments Québec", "batiments-quebec"],
    ["---Weird///Name---", "weird-name"],
  ])("%s -> %s", (input, expected) => {
    expect(slugify(input)).toBe(expected)
    expect(SLUG_PATTERN.test(expected)).toBe(true)
  })

  it("caps length without a trailing hyphen", () => {
    const slug = slugify("a".repeat(47) + " b")
    expect(slug.length).toBeLessThanOrEqual(48)
    expect(slug.endsWith("-")).toBe(false)
  })
})
