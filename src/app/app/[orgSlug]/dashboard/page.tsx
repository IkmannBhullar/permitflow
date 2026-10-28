import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileCheck2Icon,
  FolderKanbanIcon,
  HourglassIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityTimeline } from "@/features/activity/components/activity-timeline"
import { listActivity } from "@/features/activity/queries"
import {
  computeStats,
  DEADLINE_WINDOW_DAYS,
  EXPIRING_WINDOW_DAYS,
  expiringByWeek,
  needsAttention,
  permitsByStatus,
  upcomingDeadlines,
} from "@/features/dashboard/aggregate"
import { AttentionList } from "@/features/dashboard/components/attention-list"
import { DeadlineList } from "@/features/dashboard/components/deadline-list"
import { ExpiryChart } from "@/features/dashboard/components/expiry-chart"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { StatusChart } from "@/features/dashboard/components/status-chart"
import { loadDashboardData } from "@/features/dashboard/queries"
import { canEdit } from "@/features/orgs/roles"
import { listMembers, memberNames } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { todayISO } from "@/lib/dates"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage({ params }: PageProps<"/app/[orgSlug]/dashboard">) {
  const { orgSlug } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()

  const [data, activity, members] = await Promise.all([
    loadDashboardData(ctx.org.id),
    listActivity(ctx.org.id, {}, 10),
    listMembers(ctx.org.id),
  ])
  const today = todayISO()
  const base = `/app/${orgSlug}`

  if (data.activeProjects === 0 && data.permits.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description={`Permit health across ${ctx.org.name}.`} />
        <EmptyState
          icon={LayoutDashboardIcon}
          title="Nothing to report yet"
          description="Add a project and its permits. Approvals, expirations, corrections and overdue work will show up here."
          action={
            canEdit(ctx.role) ? (
              <Button asChild>
                <Link href={`${base}/projects`}>Add your first project</Link>
              </Button>
            ) : null
          }
        />
      </>
    )
  }

  const stats = computeStats(data.permits, data.openTasks, data.activeProjects, today)
  const attention = needsAttention(data.permits, data.openTasks, today)
  const deadlines = upcomingDeadlines(data.permits, data.openTasks, today)

  return (
    <>
      <PageHeader title="Dashboard" description={`Permit health across ${ctx.org.name}.`} />

      <section
        aria-label="Key numbers"
        className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7"
      >
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={FolderKanbanIcon}
          href={`${base}/projects`}
        />
        <StatCard
          label="Total permits"
          value={stats.totalPermits}
          icon={FileCheck2Icon}
          href={`${base}/permits`}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={HourglassIcon}
          href={`${base}/permits?status=submitted,under_review`}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle2Icon}
          href={`${base}/permits?status=approved`}
        />
        <StatCard
          label="Corrections required"
          value={stats.correctionsRequired}
          icon={AlertTriangleIcon}
          href={`${base}/permits?status=corrections_required`}
          tone="warning"
        />
        <StatCard
          label={`Expiring ≤ ${EXPIRING_WINDOW_DAYS} days`}
          value={stats.expiringSoon}
          icon={ClockIcon}
          href={`${base}/permits?expiring=${EXPIRING_WINDOW_DAYS}&sort=expires_at&dir=asc`}
          tone="warning"
        />
        <StatCard
          label="Overdue tasks"
          value={stats.overdueTasks}
          icon={ListTodoIcon}
          href={`${base}/tasks?view=overdue`}
          tone="danger"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permits by status</CardTitle>
            <CardDescription>Select a bar to see those permits.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusChart data={permitsByStatus(data.permits)} orgSlug={orgSlug} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expiring in the next 8 weeks</CardTitle>
            <CardDescription>Permits still in play, grouped by week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpiryChart data={expiringByWeek(data.permits, today)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs attention ({attention.length})</CardTitle>
            <CardDescription>
              Corrections, expirations, overdue tasks, stalled reviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttentionList items={attention} orgSlug={orgSlug} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
            <CardDescription>Next {DEADLINE_WINDOW_DAYS} days.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeadlineList items={deadlines} orgSlug={orgSlug} today={today} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              items={activity}
              orgSlug={orgSlug}
              names={memberNames(members)}
              linkItems
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
