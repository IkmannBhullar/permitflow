import { z } from "zod"

import { PERMIT_STATUSES, PERMIT_TYPES, type PermitStatus, type PermitType } from "./status"

export const PAGE_SIZE = 20

export const SORTABLE_COLUMNS = [
  "name",
  "status",
  "permit_type",
  "expires_at",
  "submitted_at",
  "updated_at",
] as const
export type SortColumn = (typeof SORTABLE_COLUMNS)[number]

export type PermitFilters = {
  q: string
  statuses: PermitStatus[]
  type: PermitType | null
  projectId: string | null
  assigneeId: string | null
  /** "unassigned" filters permits with no assignee */
  unassigned: boolean
  expiringDays: number | null
  sort: SortColumn
  dir: "asc" | "desc"
  page: number
}

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v)
const str = z.preprocess(first, z.string().optional())

const schema = z.object({
  q: str,
  status: str,
  type: str,
  project: str,
  assignee: str,
  expiring: str,
  sort: str,
  dir: str,
  page: str,
})

/** Parses URL search params into filters. Unknown or malformed values are ignored, never trusted. */
export function parsePermitFilters(
  params: Record<string, string | string[] | undefined>
): PermitFilters {
  const raw = schema.parse(params)
  const statuses = (raw.status ?? "")
    .split(",")
    .filter((s): s is PermitStatus => (PERMIT_STATUSES as string[]).includes(s))
  const expiring = Number(raw.expiring)
  const page = Number(raw.page)
  const uuid = (v?: string) => (v && z.uuid().safeParse(v).success ? v : null)
  return {
    q: (raw.q ?? "").trim().slice(0, 100),
    statuses,
    type: PERMIT_TYPES.includes(raw.type as PermitType) ? (raw.type as PermitType) : null,
    projectId: uuid(raw.project),
    assigneeId: uuid(raw.assignee),
    unassigned: raw.assignee === "unassigned",
    expiringDays: Number.isInteger(expiring) && expiring > 0 && expiring <= 365 ? expiring : null,
    sort: SORTABLE_COLUMNS.includes(raw.sort as SortColumn)
      ? (raw.sort as SortColumn)
      : "updated_at",
    dir: raw.dir === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/** Escapes a user search term for a PostgREST `or=(…ilike…)` filter. */
export function searchPattern(q: string): string {
  return `%${q.replace(/[%_\\]/g, (c) => `\\${c}`).replace(/[,()"*]/g, " ")}%`
}
