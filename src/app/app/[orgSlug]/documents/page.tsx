import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { DocumentList } from "@/features/documents/components/document-list"
import { UploadDocumentDialog } from "@/features/documents/components/upload-dialog"
import { listDocuments } from "@/features/documents/queries"
import { canEdit } from "@/features/orgs/roles"
import { listPermitOptionsByProject } from "@/features/permits/queries"
import { listProjectOptions } from "@/features/projects/queries"
import { listMembers, memberNames } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"

export const metadata: Metadata = { title: "Documents" }

export default async function DocumentsPage({ params }: PageProps<"/app/[orgSlug]/documents">) {
  const { orgSlug } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const [documents, members, projects, permitsByProject] = await Promise.all([
    listDocuments(ctx.org.id),
    listMembers(ctx.org.id),
    listProjectOptions(ctx.org.id),
    listPermitOptionsByProject(ctx.org.id),
  ])
  const openProjects = projects
    .filter((p) => p.status !== "archived")
    .map((p) => ({ value: p.id, label: p.name }))
  const upload =
    canEdit(ctx.role) && openProjects.length > 0 ? (
      <UploadDocumentDialog
        mode="new"
        orgSlug={orgSlug}
        projects={openProjects}
        permitsByProject={permitsByProject}
      />
    ) : null

  return (
    <>
      <PageHeader
        title="Documents"
        description="Plans, correction letters and approvals across all projects."
        actions={upload}
      />
      <DocumentList
        documents={documents}
        orgSlug={orgSlug}
        names={memberNames(members)}
        showProject
        action={upload}
      />
    </>
  )
}
