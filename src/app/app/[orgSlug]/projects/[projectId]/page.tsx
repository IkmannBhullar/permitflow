import { PencilIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityTimeline } from "@/features/activity/components/activity-timeline"
import { listActivity } from "@/features/activity/queries"
import { DocumentList } from "@/features/documents/components/document-list"
import { UploadDocumentDialog } from "@/features/documents/components/upload-dialog"
import { listDocuments } from "@/features/documents/queries"
import { canEdit, isAdmin } from "@/features/orgs/roles"
import { PermitFormDialog } from "@/features/permits/components/permit-form-dialog"
import { ProjectPermitsList } from "@/features/permits/components/project-permits-list"
import { listProjectPermits } from "@/features/permits/queries"
import { PROJECT_TYPE_LABELS } from "@/features/projects/constants"
import { ArchiveProjectButton } from "@/features/projects/components/project-admin-actions"
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog"
import { ProjectProgress } from "@/features/projects/components/project-progress"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { getProject } from "@/features/projects/queries"
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog"
import { TaskList } from "@/features/tasks/components/task-list"
import { listTasks } from "@/features/tasks/queries"
import { listMembers, memberNames, memberOptions } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { formatDate } from "@/lib/dates"

export async function generateMetadata({
  params,
}: PageProps<"/app/[orgSlug]/projects/[projectId]">): Promise<Metadata> {
  const { orgSlug, projectId } = await params
  const ctx = await getOrgContext(orgSlug)
  const project = ctx ? await getProject(ctx.org.id, projectId) : null
  return { title: project?.name ?? "Project" }
}

export default async function ProjectPage({
  params,
}: PageProps<"/app/[orgSlug]/projects/[projectId]">) {
  const { orgSlug, projectId } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const [project, members, activity, permits, tasks, documents] = await Promise.all([
    getProject(ctx.org.id, projectId),
    listMembers(ctx.org.id),
    listActivity(ctx.org.id, { projectId }),
    listProjectPermits(ctx.org.id, projectId),
    listTasks(ctx.org.id, { projectId }),
    listDocuments(ctx.org.id, { projectId }),
  ])
  if (!project) notFound()

  const names = memberNames(members)
  const archived = project.status === "archived"
  const editable = canEdit(ctx.role) && !archived
  const addPermit = editable ? (
    <PermitFormDialog
      orgSlug={orgSlug}
      members={memberOptions(members)}
      projects={[{ value: project.id, label: project.name }]}
      defaultProjectId={project.id}
      trigger={
        <Button size="sm">
          <PlusIcon /> Add permit
        </Button>
      }
    />
  ) : null
  const permitOptions = permits.map((p) => ({ value: p.id, label: p.name }))
  const upload = editable ? (
    <UploadDocumentDialog
      mode="new"
      orgSlug={orgSlug}
      projects={[{ value: project.id, label: project.name }]}
      permitsByProject={{ [project.id]: permitOptions }}
      defaultProjectId={project.id}
    />
  ) : null
  const addTask = editable ? (
    <TaskFormDialog
      orgSlug={orgSlug}
      projectId={project.id}
      members={memberOptions(members)}
      permits={permitOptions}
      trigger={
        <Button size="sm" variant="outline">
          <PlusIcon /> Add task
        </Button>
      }
    />
  ) : null
  const details: [string, React.ReactNode][] = [
    ["Type", PROJECT_TYPE_LABELS[project.project_type]],
    ["Address", [project.address, project.city].filter(Boolean).join(", ") || "—"],
    ["Jurisdiction", project.jurisdiction || "—"],
    ["Manager", project.manager_id ? names[project.manager_id] : "—"],
    ["Start", formatDate(project.start_date)],
    ["Target completion", formatDate(project.target_completion_date)],
  ]

  return (
    <>
      <div className="space-y-2">
        <Link
          href={`/app/${orgSlug}/projects`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Projects
        </Link>
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {project.name} <ProjectStatusBadge status={project.status} />
            </span>
          }
          actions={
            <>
              {editable ? (
                <ProjectFormDialog
                  orgSlug={orgSlug}
                  members={memberOptions(members)}
                  project={project}
                  trigger={
                    <Button variant="outline">
                      <PencilIcon /> Edit
                    </Button>
                  }
                />
              ) : null}
              {isAdmin(ctx.role) ? (
                <ArchiveProjectButton
                  orgSlug={orgSlug}
                  projectId={project.id}
                  archived={archived}
                />
              ) : null}
            </>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permit progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProjectProgress progress={project.progress} />
            <p className="text-sm text-muted-foreground">
              {project.progress.total === 0
                ? "No permits yet."
                : `${project.progress.done} of ${project.progress.total} permits approved or closed.`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Permits</CardTitle>
          {permits.length > 0 ? addPermit : null}
        </CardHeader>
        <CardContent>
          <ProjectPermitsList
            permits={permits}
            orgSlug={orgSlug}
            names={names}
            action={addPermit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tasks</CardTitle>
          {tasks.length > 0 ? addTask : null}
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={tasks}
            orgSlug={orgSlug}
            role={ctx.role}
            names={names}
            members={memberOptions(members)}
            permitOptionsFor={() => permitOptions}
            action={addTask}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documents</CardTitle>
          {documents.length > 0 ? upload : null}
        </CardHeader>
        <CardContent>
          <DocumentList documents={documents} orgSlug={orgSlug} names={names} action={upload} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={activity} orgSlug={orgSlug} names={names} linkItems />
        </CardContent>
      </Card>
    </>
  )
}
