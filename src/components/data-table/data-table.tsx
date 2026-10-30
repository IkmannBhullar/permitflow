"use client"

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Thin TanStack Table wrapper. Sorts client-side by default; pass `sorting` and
 * `onSortingChange` to sort on the server instead (the permits table does this).
 */
export function DataTable<TData>({
  columns,
  data,
  sorting: controlledSorting,
  onSortingChange,
  emptyMessage = "No results.",
  getRowId,
}: {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  emptyMessage?: string
  getRowId?: (row: TData) => string
}) {
  const [localSorting, setLocalSorting] = useState<SortingState>([])
  const manual = Boolean(onSortingChange)
  // TanStack returns a mutable table instance, so React Compiler skips memoizing this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting: manual ? (controlledSorting ?? []) : localSorting },
    onSortingChange: manual ? onSortingChange : setLocalSorting,
    manualSorting: manual,
    enableSortingRemoval: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manual ? undefined : getSortedRowModel(),
  })

  return (
    <div className="@container overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="bg-muted/40 hover:bg-muted/40">
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                const canSort = header.column.getCanSort()
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-9 text-xs",
                      (header.column.columnDef.meta as ColumnMeta)?.className
                    )}
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUpIcon className="size-3" aria-hidden />
                        ) : sorted === "desc" ? (
                          <ArrowDownIcon className="size-3" aria-hidden />
                        ) : (
                          <ArrowUpDownIcon className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("py-2.5", (cell.column.columnDef.meta as ColumnMeta)?.className)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Per-column extras. `className` hides columns when the table itself is narrow, using container
 * queries (e.g. "hidden @2xl:table-cell"), so the sidebar's width is accounted for.
 */
export type ColumnMeta = { className?: string }
