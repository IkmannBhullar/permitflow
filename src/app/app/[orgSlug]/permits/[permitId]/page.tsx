import { PencilIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityTimeline } from "@/features/activity/components/activity-timeline"
import { listActivity } from "@/features/activity/queries"
import { CommentsSection } from "@/features/comments/components/comments-section"
import { listComments } from "@/features/comments/queries"
import { canEdit, isAdmin } from "@/features/orgs/roles"
import { DeletePermitButton } from "@/features/permits/components/delete-permit-button"
import { ExpiryLabel } from "@/features/permits/components/expiry-label"
import { PermitFormDialog } from "@/features/permits/components/permit-form-dialog"
import { PermitStatusBadge } from "@/features/permits/components/permit-status-badge"
import { StatusChangeDialog } from "@/features/permits/components/status-change-dialog"
import { getPermit } from "@/features/permits/queries"
import { PERMIT_TYPE_LABELS } from "@/features/permits/status"
import { listProjectOptions } from "@/features/projects/queries"
import { listMembers, memberNames, memberOptions } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { formatDate, formatDateTime } from "@/lib/dates"

export async function generateMetadata({
  params,
}: PageProps<"/app/[orgSlug]/permits/[permitId]">): Promise<Metadata> {
  const { orgSlug, permitId } = await params
  const ctx = await getOrgContext(orgSlug)
  const permit = ctx ? await getPermit(ctx.org.id, permitId) : null
  return { title: permit?.name ?? "Permit" }
}

export default async function PermitPage({
  params,
}: PageProps<"/app/[orgSlug]/permits/[permitId]">) {
  const { orgSlug, permitId } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const [permit, members, projects, comments, activity] = await Promise.all([
    getPermit(ctx.org.id, permitId),
    listMembers(ctx.org.id),
    listProjectOptions(ctx.org.id),
    listComments(ctx.org.id, "permit", permitId),
    listActivity(ctx.org.id, { entity: { type: "permit", id: permitId } }, 50),
  ])
  if (!permit) notFound()

  const names = memberNames(members)
  const editor = canEdit(ctx.role)
  const details: [string, React.ReactNode][] = [
    ["Type", PERMIT_TYPE_LABELS[permit.permit_type]],
    ["Jurisdiction", permit.jurisdiction || "—"],
    ["Application #", permit.application_number ?? "—"],
    ["Assignee", permit.assignee_id ? names[permit.assignee_id] : "Unassigned"],
    ["Submitted", formatDate(permit.submitted_at)],
    ["Approved", formatDate(permit.approved_at)],
    ["Expires", <ExpiryLabel key="expires" date={permit.expires_at} />],
    ["Status since", formatDateTime(permit.status_changed_at)],
  ]

  return (
    <>
      <div className="space-y-2">
        <Link
          href={`/app/${orgSlug}/projects/${permit.project.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {permit.project.name}
        </Link>
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {permit.name} <PermitStatusBadge status={permit.status} />
            </span>
          }
          actions={
            <>
              {editor ? (
                <>
                  <StatusChangeDialog
                    orgSlug={orgSlug}
                    permitId={permit.id}
                    status={permit.status}
                    approvedAt={permit.approved_at}
                  />
                  <PermitFormDialog
                    orgSlug={orgSlug}
                    members={memberOptions(members)}
                    projects={projects
                      .filter((p) => p.status !== "archived" || p.id === permit.project_id)
                      .map((p) => ({ value: p.id, label: p.name }))}
                    permit={permit}
                    trigger={
                      <Button variant="outline">
                        <PencilIcon /> Edit
                      </Button>
                    }
                  />
                </>
              ) : null}
              {isAdmin(ctx.role) ? (
                <DeletePermitButton orgSlug={orgSlug} permitId={permit.id} />
              ) : null}
            </>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {details.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="text-sm">
                <p className="text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{permit.notes || "No notes yet."}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsSection
                comments={comments}
                orgSlug={orgSlug}
                entityType="permit"
                entityId={permit.id}
                role={ctx.role}
                userId={ctx.userId}
              />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline items={activity} orgSlug={orgSlug} names={names} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
