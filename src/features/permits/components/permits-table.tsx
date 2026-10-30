"use client"

import type { ColumnDef, SortingState } from "@tanstack/react-table"
import Link from "next/link"

import { DataTable } from "@/components/data-table/data-table"
import { useUrlState } from "@/components/data-table/use-url-state"
import { formatDate } from "@/lib/dates"

import type { PermitListRow } from "../queries"
import { PERMIT_TYPE_LABELS } from "../status"
import { ExpiryLabel } from "./expiry-label"
import { PermitStatusBadge } from "./permit-status-badge"

export function PermitsTable({
  rows,
  orgSlug,
  names,
  sort,
  dir,
  showProject = true,
}: {
  rows: PermitListRow[]
  orgSlug: string
  names: Record<string, string>
  sort: string
  dir: "asc" | "desc"
  showProject?: boolean
}) {
  const { setParams } = useUrlState()
  const sorting: SortingState = [{ id: sort, desc: dir === "desc" }]

  const columns: ColumnDef<PermitListRow, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Permit",
      cell: ({ row }) => (
        <div className="min-w-0 sm:min-w-40">
          <Link
            href={`/app/${orgSlug}/permits/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          <p className="text-xs break-words text-muted-foreground sm:truncate">
            {row.original.application_number ?? "No application #"}
            {row.original.jurisdiction ? ` · ${row.original.jurisdiction}` : ""}
          </p>
        </div>
      ),
      meta: { className: "whitespace-normal" },
    },
    ...(showProject
      ? [
          {
            id: "project",
            header: "Project",
            enableSorting: false,
            cell: ({ row }) => (
              <Link
                href={`/app/${orgSlug}/projects/${row.original.project.id}`}
                className="hover:underline"
              >
                {row.original.project.name}
              </Link>
            ),
            meta: { className: "hidden @2xl:table-cell" },
          } satisfies ColumnDef<PermitListRow, unknown>,
        ]
      : []),
    {
      id: "permit_type",
      accessorKey: "permit_type",
      header: "Type",
      cell: ({ row }) => PERMIT_TYPE_LABELS[row.original.permit_type],
      meta: { className: "hidden @4xl:table-cell" },
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PermitStatusBadge status={row.original.status} />,
    },
    {
      id: "assignee",
      header: "Assignee",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.assignee_id ? (
          names[row.original.assignee_id]
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
      meta: { className: "hidden @3xl:table-cell" },
    },
    {
      id: "submitted_at",
      accessorKey: "submitted_at",
      header: "Submitted",
      cell: ({ row }) => formatDate(row.original.submitted_at),
      meta: { className: "hidden @6xl:table-cell" },
    },
    {
      id: "expires_at",
      accessorKey: "expires_at",
      header: "Expires",
      cell: ({ row }) => (
        <ExpiryLabel date={row.original.expires_at} status={row.original.status} />
      ),
      meta: { className: "hidden @lg:table-cell" },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.id}
      sorting={sorting}
      emptyMessage="No permits match these filters."
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater
        const first = next[0]
        setParams(
          first ? { sort: first.id, dir: first.desc ? "desc" : "asc" } : { sort: null, dir: null }
        )
      }}
    />
  )
}
