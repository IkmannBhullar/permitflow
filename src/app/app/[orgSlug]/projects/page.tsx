import { FolderKanbanIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { canEdit } from "@/features/orgs/roles"
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog"
import { ProjectsTable } from "@/features/projects/components/projects-table"
import { listProjects } from "@/features/projects/queries"
import { listMembers, memberNames, memberOptions } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Projects" }

export default async function ProjectsPage({
  params,
  searchParams,
}: PageProps<"/app/[orgSlug]/projects">) {
  const [{ orgSlug }, { view }] = await Promise.all([params, searchParams])
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const archived = view === "archived"
  const [projects, members] = await Promise.all([
    listProjects(ctx.org.id, { archived }),
    listMembers(ctx.org.id),
  ])
  const editor = canEdit(ctx.role)

  const newProject = editor ? (
    <ProjectFormDialog
      orgSlug={orgSlug}
      members={memberOptions(members)}
      trigger={
        <Button>
          <PlusIcon /> New project
        </Button>
      }
    />
  ) : null

  const base = `/app/${orgSlug}/projects`
  return (
    <>
      <PageHeader
        title="Projects"
        description="Every job site and its permit progress."
        actions={newProject}
      />
      <nav aria-label="Project views" className="flex gap-1 border-b">
        {[
          { label: "Active", href: base, current: !archived },
          { label: "Archived", href: `${base}?view=archived`, current: archived },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.current ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab.current
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {projects.length === 0 ? (
        archived ? (
          <EmptyState
            icon={FolderKanbanIcon}
            title="No archived projects"
            description="Projects you archive will be listed here."
          />
        ) : (
          <EmptyState
            icon={FolderKanbanIcon}
            title="No projects yet"
            description={
              editor
                ? "Add your first project to start tracking its permits."
                : "Your team hasn't added any projects yet."
            }
            action={newProject}
          />
        )
      ) : (
        <ProjectsTable projects={projects} orgSlug={orgSlug} names={memberNames(members)} />
      )}
    </>
  )
}
