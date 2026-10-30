"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { DataTable } from "@/components/data-table/data-table"
import { formatDate } from "@/lib/dates"

import { PROJECT_TYPE_LABELS } from "../constants"
import type { ProjectRow } from "../queries"
import { ProjectProgress } from "./project-progress"
import { ProjectStatusBadge } from "./project-status-badge"

export function ProjectsTable({
  projects,
  orgSlug,
  names,
}: {
  projects: ProjectRow[]
  orgSlug: string
  names: Record<string, string>
}) {
  const columns: ColumnDef<ProjectRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Project",
      cell: ({ row }) => (
        <div className="min-w-0 sm:min-w-40">
          <Link
            href={`/app/${orgSlug}/projects/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {[row.original.address, row.original.city].filter(Boolean).join(", ") || "No address"}
          </p>
        </div>
      ),
      meta: { className: "whitespace-normal" },
    },
    {
      accessorKey: "project_type",
      header: "Type",
      cell: ({ row }) => PROJECT_TYPE_LABELS[row.original.project_type],
      meta: { className: "hidden @3xl:table-cell" },
    },
    {
      id: "manager",
      accessorFn: (p) => (p.manager_id ? names[p.manager_id] : "") ?? "",
      header: "Manager",
      cell: ({ getValue }) =>
        (getValue() as string) || <span className="text-muted-foreground">None</span>,
      meta: { className: "hidden @4xl:table-cell" },
    },
    {
      id: "progress",
      accessorFn: (p) => p.progress.percent,
      header: "Permits",
      cell: ({ row }) => <ProjectProgress progress={row.original.progress} compact />,
      meta: { className: "hidden @lg:table-cell" },
    },
    {
      accessorKey: "target_completion_date",
      header: "Target",
      cell: ({ row }) => formatDate(row.original.target_completion_date),
      meta: { className: "hidden @2xl:table-cell" },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    },
  ]

  return <DataTable columns={columns} data={projects} getRowId={(p) => p.id} />
}
