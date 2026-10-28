export type Cell = string | number | null | undefined
export type Column = { key: string; header: string }

/**
 * RFC 4180 CSV. Values that a spreadsheet would treat as a formula (=, +, -, @, tab, CR)
 * are prefixed with an apostrophe so exported data can't execute in Excel or Sheets.
 */
export function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return ""
  let text = String(value)
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns: Column[], rows: Record<string, Cell>[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(",")]
  for (const row of rows) lines.push(columns.map((c) => escapeCell(row[c.key])).join(","))
  // BOM so Excel opens UTF-8 (en dashes, accents) correctly.
  return `﻿${lines.join("\r\n")}\r\n`
}
