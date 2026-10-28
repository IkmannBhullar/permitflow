import { ChevronRightIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { REPORT_IDS, REPORTS } from "@/features/reports/definitions"

export const metadata: Metadata = { title: "Reports" }

export default async function ReportsPage({ params }: PageProps<"/app/[orgSlug]/reports">) {
  const { orgSlug } = await params
  return (
    <>
      <PageHeader
        title="Reports"
        description="Export to CSV or print / save as PDF from your browser."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {REPORT_IDS.map((id) => (
          <li key={id}>
            <Link
              href={`/app/${orgSlug}/reports/${id}`}
              className="flex h-full items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="flex-1 space-y-1">
                <span className="block font-medium">{REPORTS[id].title}</span>
                <span className="block text-sm text-muted-foreground">
                  {REPORTS[id].description}
                </span>
              </span>
              <ChevronRightIcon className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
