import { describe, expect, it } from "vitest"

import {
  formatBytes,
  MAX_FILE_BYTES,
  nameFromFile,
  safeFileName,
  storagePath,
  validateFile,
} from "./files"

describe("validateFile", () => {
  it("accepts a PDF under the limit", () => {
    expect(validateFile({ name: "plans.pdf", size: 1000, type: "application/pdf" })).toBeNull()
  })

  it("rejects disallowed types and mismatched extensions", () => {
    expect(validateFile({ name: "run.sh", size: 10, type: "application/x-sh" })).toMatch(
      /isn't supported/
    )
    expect(validateFile({ name: "plans.exe", size: 10, type: "application/pdf" })).toMatch(
      /isn't supported/
    )
  })

  it("rejects empty and oversized files", () => {
    expect(validateFile({ name: "a.pdf", size: 0, type: "application/pdf" })).toMatch(/empty/)
    expect(
      validateFile({ name: "a.pdf", size: MAX_FILE_BYTES + 1, type: "application/pdf" })
    ).toMatch(/25 MB/)
  })
})

describe("file names", () => {
  it("makes storage-safe names and keeps the extension", () => {
    expect(safeFileName("Site Plan (rev C) – final.PDF")).toBe("Site-Plan-rev-C-final.pdf")
    expect(safeFileName("../../etc/passwd.pdf")).toBe("etc-passwd.pdf")
  })

  it("derives a readable document name", () => {
    expect(nameFromFile("site_plan-rev-c.pdf")).toBe("site plan rev c")
  })

  it("builds org-first storage paths", () => {
    expect(storagePath("org", "proj", "doc", 2, "a b.pdf")).toBe("org/proj/doc/v2/a-b.pdf")
  })

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB")
  })
})
