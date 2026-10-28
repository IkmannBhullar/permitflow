import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/dates"

import type { Cell } from "../csv"
import type { ReportResult } from "../definitions"

/** CSV keeps ISO dates (sortable); people get "Oct 18, 2026". */
const display = (value: Cell) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : (value ?? "")

export function ReportTable({ report, orgSlug }: { report: ReportResult; orgSlug: string }) {
  return (
    <div className="overflow-hidden rounded-lg border print:overflow-visible print:rounded-none print:border-0">
      <Table className="print:text-[10px]">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {report.columns.map((c) => (
              <TableHead key={c.key} className="h-9 text-xs print:h-auto print:whitespace-normal">
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={report.columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Nothing to report.
              </TableCell>
            </TableRow>
          ) : (
            report.rows.map((row, i) => (
              <TableRow key={i} className="print:break-inside-avoid">
                {report.columns.map((c, j) => (
                  <TableCell key={c.key} className="py-2 whitespace-normal print:py-1">
                    {j === 0 && row.href ? (
                      <Link
                        href={`/app/${orgSlug}/${row.href}`}
                        className="font-medium hover:underline print:no-underline"
                      >
                        {display(row[c.key])}
                      </Link>
                    ) : (
                      display(row[c.key])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
