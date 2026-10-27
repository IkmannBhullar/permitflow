import { FileCheck2Icon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PaginationBar } from "@/components/data-table/pagination"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { canEdit } from "@/features/orgs/roles"
import { PermitFormDialog } from "@/features/permits/components/permit-form-dialog"
import { PermitsTable } from "@/features/permits/components/permits-table"
import { PermitsToolbar } from "@/features/permits/components/permits-toolbar"
import { PAGE_SIZE, parsePermitFilters } from "@/features/permits/filters"
import { listPermits } from "@/features/permits/queries"
import { listProjectOptions } from "@/features/projects/queries"
import { listMembers, memberNames, memberOptions } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"

export const metadata: Metadata = { title: "Permits" }

export default async function PermitsPage({
  params,
  searchParams,
}: PageProps<"/app/[orgSlug]/permits">) {
  const [{ orgSlug }, rawParams] = await Promise.all([params, searchParams])
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const filters = parsePermitFilters(rawParams)
  const [{ rows, total }, projects, members] = await Promise.all([
    listPermits(ctx.org.id, filters),
    listProjectOptions(ctx.org.id),
    listMembers(ctx.org.id),
  ])

  const openProjects = projects
    .filter((p) => p.status !== "archived")
    .map((p) => ({ value: p.id, label: p.name }))
  const editor = canEdit(ctx.role)
  const addPermit =
    editor && openProjects.length > 0 ? (
      <PermitFormDialog
        orgSlug={orgSlug}
        members={memberOptions(members)}
        projects={openProjects}
        trigger={
          <Button>
            <PlusIcon /> Add permit
          </Button>
        }
      />
    ) : null

  const hasFilters = Object.keys(rawParams).some((k) => k !== "page" && k !== "sort" && k !== "dir")
  if (total === 0 && !hasFilters) {
    return (
      <>
        <PageHeader title="Permits" description="Every permit across every project." />
        <EmptyState
          icon={FileCheck2Icon}
          title="No permits yet"
          description={
            !editor
              ? "Your team hasn't added any permits yet."
              : openProjects.length === 0
                ? "Permits belong to a project. Create a project first, then add its permits."
                : "Add your first permit to start tracking it."
          }
          action={addPermit}
        />
      </>
    )
  }

  const hrefFor = (page: number) => {
    const qs = new URLSearchParams(
      Object.entries(rawParams).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))
    )
    qs.set("page", String(page))
    return `/app/${orgSlug}/permits?${qs}`
  }

  return (
    <>
      <PageHeader
        title="Permits"
        description="Every permit across every project."
        actions={addPermit}
      />
      <PermitsToolbar
        projects={projects.map((p) => ({ value: p.id, label: p.name }))}
        members={memberOptions(members)}
      />
      <PermitsTable
        rows={rows}
        orgSlug={orgSlug}
        names={memberNames(members)}
        sort={filters.sort}
        dir={filters.dir}
      />
      <PaginationBar page={filters.page} pageSize={PAGE_SIZE} total={total} hrefFor={hrefFor} />
    </>
  )
}
