"use client"

import { SearchIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { useUrlState } from "@/components/data-table/use-url-state"
import type { SelectOption } from "@/components/form/select-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { PERMIT_STATUS_META, PERMIT_STATUSES, PERMIT_TYPE_LABELS, PERMIT_TYPES } from "../status"

const ALL = "__all__"
const STATUS_OPTIONS: SelectOption[] = [
  { value: "submitted,under_review", label: "Pending (submitted + under review)" },
  ...PERMIT_STATUSES.map((s) => ({ value: s, label: PERMIT_STATUS_META[s].label })),
]
const TYPE_OPTIONS = PERMIT_TYPES.map((t) => ({ value: t, label: PERMIT_TYPE_LABELS[t] }))
const EXPIRING_OPTIONS = [7, 14, 30, 60, 90].map((d) => ({
  value: String(d),
  label: `Expiring in ≤ ${d} days`,
}))
const FILTER_KEYS = ["q", "status", "type", "project", "assignee", "expiring"]

function FilterSelect({
  label,
  param,
  options,
  allLabel,
}: {
  label: string
  param: string
  options: SelectOption[]
  allLabel: string
}) {
  const { searchParams, setParams } = useUrlState()
  const value = searchParams.get(param) ?? ALL
  // A value from a hand-edited URL that isn't an option still shows, rather than silently vanishing.
  const known = value === ALL || options.some((o) => o.value === value)
  const current =
    value === ALL ? allLabel : (options.find((o) => o.value === value)?.label ?? value)
  return (
    <Select value={value} onValueChange={(v) => setParams({ [param]: v === ALL ? null : v })}>
      <SelectTrigger
        aria-label={`${label}: ${current}`}
        className="w-full sm:w-auto sm:min-w-36"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {known ? null : <SelectItem value={value}>{value.replaceAll(",", ", ")}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PermitsToolbar({
  projects,
  members,
}: {
  projects: SelectOption[]
  members: SelectOption[]
}) {
  const { searchParams, setParams, pending } = useUrlState()
  const urlQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(urlQuery)

  useEffect(() => {
    if (query === urlQuery) return
    const timer = setTimeout(() => setParams({ q: query.trim() || null }), 300)
    return () => clearTimeout(timer)
  }, [query, urlQuery, setParams])

  const active = FILTER_KEYS.some((k) => searchParams.has(k))

  return (
    <div
      className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center"
      aria-busy={pending}
    >
      <div className="relative lg:w-64">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, application #, jurisdiction"
          aria-label="Search permits"
          className="h-8 pl-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <FilterSelect
          label="Filter by status"
          param="status"
          options={STATUS_OPTIONS}
          allLabel="All statuses"
        />
        <FilterSelect
          label="Filter by type"
          param="type"
          options={TYPE_OPTIONS}
          allLabel="All types"
        />
        <FilterSelect
          label="Filter by project"
          param="project"
          options={projects}
          allLabel="All projects"
        />
        <FilterSelect
          label="Filter by assignee"
          param="assignee"
          options={[{ value: "unassigned", label: "Unassigned" }, ...members]}
          allLabel="Anyone"
        />
        <FilterSelect
          label="Filter by expiration"
          param="expiring"
          options={EXPIRING_OPTIONS}
          allLabel="Any expiration"
        />
      </div>
      {active ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("")
            setParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))
          }}
        >
          <XIcon /> Clear filters
        </Button>
      ) : null}
    </div>
  )
}
