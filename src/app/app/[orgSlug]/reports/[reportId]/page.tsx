import { DownloadIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Disclaimer } from "@/components/disclaimer"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { PrintButton } from "@/features/reports/components/print-button"
import { ReportTable } from "@/features/reports/components/report-table"
import {
  buildReport,
  EXPIRING_WINDOWS,
  parseReportParams,
  REPORT_IDS,
  REPORTS,
  type ReportId,
} from "@/features/reports/definitions"
import { loadReportData } from "@/features/reports/queries"
import { listMembers, memberNames } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { formatDate, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: PageProps<"/app/[orgSlug]/reports/[reportId]">): Promise<Metadata> {
  const { reportId } = await params
  return { title: REPORTS[reportId as ReportId]?.title ?? "Report" }
}

export default async function ReportPage({
  params,
  searchParams,
}: PageProps<"/app/[orgSlug]/reports/[reportId]">) {
  const [{ orgSlug, reportId }, rawParams] = await Promise.all([params, searchParams])
  if (!REPORT_IDS.includes(reportId as ReportId)) notFound()
  const id = reportId as ReportId
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()

  const today = todayISO()
  const { days } = parseReportParams(rawParams)
  const [data, members] = await Promise.all([
    loadReportData(ctx.supabase, ctx.org.id),
    listMembers(ctx.org.id),
  ])
  const report = buildReport(id, data, { today, names: memberNames(members), days })
  const base = `/app/${orgSlug}/reports/${id}`
  const exportHref = `${base}/export${id === "expiring" ? `?days=${days}` : ""}`

  return (
    <>
      <div className="space-y-2">
        <Link
          href={`/app/${orgSlug}/reports`}
          className="text-sm text-muted-foreground hover:text-foreground print:hidden"
        >
          ← Reports
        </Link>
        <PageHeader
          title={REPORTS[id].title}
          description={
            <>
              {ctx.org.name} · generated {formatDate(today)} · {report.summary}
            </>
          }
          actions={
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button asChild variant="outline">
                <a href={exportHref} download>
                  <DownloadIcon /> Export CSV
                </a>
              </Button>
              <PrintButton />
            </div>
          }
        />
      </div>

      {id === "expiring" ? (
        <nav aria-label="Expiration window" className="flex flex-wrap gap-1 print:hidden">
          {EXPIRING_WINDOWS.map((d) => (
            <Link
              key={d}
              href={`${base}?days=${d}`}
              aria-current={d === days ? "page" : undefined}
              className={cn(
                "rounded-md border px-2.5 py-1 text-sm",
                d === days
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d} days
            </Link>
          ))}
        </nav>
      ) : null}

      <p className="text-sm text-muted-foreground print:hidden">{REPORTS[id].description}</p>
      <ReportTable report={report} orgSlug={orgSlug} />
      <Disclaimer className="hidden print:block" />
    </>
  )
}
