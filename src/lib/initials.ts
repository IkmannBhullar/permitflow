export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const value = (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  return value.toUpperCase() || "?"
}
