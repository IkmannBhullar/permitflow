import { describe, expect, it } from "vitest"

import { escapeCell, toCsv } from "./csv"

describe("escapeCell", () => {
  it("leaves plain values alone", () => {
    expect(escapeCell("Building permit")).toBe("Building permit")
    expect(escapeCell(42)).toBe("42")
    expect(escapeCell(-3)).toBe("-3")
    expect(escapeCell(null)).toBe("")
  })

  it("quotes commas, quotes and newlines", () => {
    expect(escapeCell("Smith, LLC")).toBe('"Smith, LLC"')
    expect(escapeCell('6" overhang')).toBe('"6"" overhang"')
    expect(escapeCell("line 1\nline 2")).toBe('"line 1\nline 2"')
  })

  it("neutralizes spreadsheet formulas in text", () => {
    expect(escapeCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"')
    expect(escapeCell("+1234")).toBe("'+1234")
    expect(escapeCell("@SUM(A1)")).toBe("'@SUM(A1)")
  })
})

describe("toCsv", () => {
  it("writes a header row, CRLF line endings and a UTF-8 BOM", () => {
    const csv = toCsv(
      [
        { key: "name", header: "Permit" },
        { key: "days", header: "Days" },
      ],
      [
        { name: "Grading – phase 1", days: 12 },
        { name: "Fire, alarm", days: null },
      ]
    )
    expect(csv).toBe('﻿Permit,Days\r\nGrading – phase 1,12\r\n"Fire, alarm",\r\n')
  })
})
