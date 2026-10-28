import { NextResponse, type NextRequest } from "next/server"

import {
  buildReport,
  parseReportParams,
  REPORT_IDS,
  type ReportId,
} from "@/features/reports/definitions"
import { toCsv } from "@/features/reports/csv"
import { loadReportData } from "@/features/reports/queries"
import { listMembers, memberNames } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { todayISO } from "@/lib/dates"
import { reportError } from "@/lib/errors"

/** CSV export. Uses the caller's session, so RLS limits it to orgs they belong to. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/[orgSlug]/reports/[reportId]/export">
) {
  const { orgSlug, reportId } = await params
  if (!REPORT_IDS.includes(reportId as ReportId))
    return new NextResponse("Report not found", { status: 404 })
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) return new NextResponse("Not found", { status: 404 })

  try {
    const today = todayISO()
    const { days } = parseReportParams(Object.fromEntries(request.nextUrl.searchParams))
    const [data, members] = await Promise.all([
      loadReportData(ctx.supabase, ctx.org.id),
      listMembers(ctx.org.id),
    ])
    const report = buildReport(reportId as ReportId, data, {
      today,
      names: memberNames(members),
      days,
    })
    const suffix = reportId === "expiring" ? `-${days}d` : ""
    return new NextResponse(toCsv(report.columns, report.rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${ctx.org.slug}-${reportId}${suffix}-${today}.csv"`,
        "cache-control": "private, no-store",
      },
    })
  } catch (error) {
    reportError("reports:export", error)
    return new NextResponse("Couldn't build the report. Try again.", { status: 500 })
  }
}
