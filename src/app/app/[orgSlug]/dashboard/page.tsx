import { LayoutDashboardIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { getOrgContext } from "@/lib/actions"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage({ params }: PageProps<"/app/[orgSlug]/dashboard">) {
  const { orgSlug } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()

  return (
    <>
      <PageHeader title="Dashboard" description={`Permit health across ${ctx.org.name}.`} />
      <EmptyState
        icon={LayoutDashboardIcon}
        title="Nothing to report yet"
        description="Once your team adds projects and permits, approvals, expirations and overdue work show up here."
      />
    </>
  )
}
