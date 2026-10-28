import { AlertTriangleIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listPermitOptionsByProject } from "@/features/permits/queries"
import { TaskList } from "@/features/tasks/components/task-list"
import { listCorrectionPermits, listTasks } from "@/features/tasks/queries"
import { listMembers, memberNames, memberOptions } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { daysBetween, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Tasks" }

const VIEWS = [
  { key: "mine", label: "My tasks" },
  { key: "overdue", label: "Overdue" },
  { key: "corrections", label: "Corrections" },
  { key: "open", label: "All open" },
] as const
type View = (typeof VIEWS)[number]["key"]

export default async function TasksPage({
  params,
  searchParams,
}: PageProps<"/app/[orgSlug]/tasks">) {
  const [{ orgSlug }, { view: rawView }] = await Promise.all([params, searchParams])
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const view: View = VIEWS.some((v) => v.key === rawView) ? (rawView as View) : "mine"
  const today = todayISO()

  const scope =
    view === "mine"
      ? { assigneeId: ctx.userId, openOnly: true }
      : view === "overdue"
        ? { dueBefore: today }
        : view === "corrections"
          ? { correctionsOnly: true, openOnly: true }
          : { openOnly: true }

  const [tasks, members, permitsByProject, correctionPermits] = await Promise.all([
    listTasks(ctx.org.id, scope),
    listMembers(ctx.org.id),
    listPermitOptionsByProject(ctx.org.id),
    view === "corrections" ? listCorrectionPermits(ctx.org.id) : Promise.resolve([]),
  ])
  const names = memberNames(members)
  const base = `/app/${orgSlug}`
  const empty: Record<View, string> = {
    mine: "Nothing is assigned to you right now.",
    overdue: "No overdue tasks. Nice.",
    corrections: "No open correction tasks.",
    open: "No open tasks. Add tasks from a project or permit page.",
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Assigned work across every project. Add tasks from a project or permit page."
      />
      <nav aria-label="Task views" className="flex gap-1 overflow-x-auto border-b">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`${base}/tasks?view=${v.key}`}
            aria-current={v.key === view ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              v.key === view
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {view === "corrections" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Permits waiting on corrections ({correctionPermits.length})
            </CardTitle>
            <CardDescription>
              Each needs its reviewer comments resolved and the permit resubmitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {correctionPermits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No permits are in corrections required.
              </p>
            ) : (
              <ul className="divide-y">
                {correctionPermits.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`${base}/permits/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.project.name} · {p.assignee_id ? names[p.assignee_id] : "Unassigned"} ·
                        waiting {daysBetween(p.status_changed_at.slice(0, 10), today)} days
                      </p>
                    </div>
                    {p.openCorrections === 0 ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/50 text-amber-700 dark:text-amber-400"
                      >
                        <AlertTriangleIcon aria-hidden /> No open correction tasks
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {p.openCorrections} open · {p.doneCorrections} done
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <TaskList
        tasks={tasks}
        orgSlug={orgSlug}
        role={ctx.role}
        names={names}
        members={memberOptions(members)}
        permitOptionsFor={(projectId) => permitsByProject[projectId] ?? []}
        showProject
        emptyDescription={empty[view]}
      />
    </>
  )
}
