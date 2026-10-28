import { BellIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MarkAllReadButton,
  MarkReadButton,
  RunDueCheckButton,
} from "@/features/notifications/components/notification-buttons"
import { NotificationItem } from "@/features/notifications/components/notification-item"
import { EXPIRY_THRESHOLDS } from "@/features/notifications/due"
import { listNotifications } from "@/features/notifications/queries"
import { isAdmin } from "@/features/orgs/roles"
import { getOrgContext } from "@/lib/actions"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Notifications" }

export default async function NotificationsPage({
  params,
  searchParams,
}: PageProps<"/app/[orgSlug]/notifications">) {
  const [{ orgSlug }, { filter }] = await Promise.all([params, searchParams])
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const unreadOnly = filter === "unread"
  const { items, unread } = await listNotifications(ctx.org.id, ctx.userId, {
    limit: 100,
    unreadOnly,
  })
  const base = `/app/${orgSlug}/notifications`

  return (
    <>
      <PageHeader
        title="Notifications"
        description="In-app only. PermitFlow doesn't send email or text messages."
        actions={unread ? <MarkAllReadButton orgSlug={orgSlug} /> : null}
      />
      <nav aria-label="Notification filters" className="flex gap-1 border-b">
        {[
          { label: "All", href: base, current: !unreadOnly },
          { label: `Unread (${unread})`, href: `${base}?filter=unread`, current: unreadOnly },
        ].map((tab) => (
          <Link
            key={tab.href}
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

      {items.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title={unreadOnly ? "No unread notifications" : "No notifications yet"}
          description="You'll hear about permits and tasks assigned to you, status changes, expiring permits and overdue tasks."
        />
      ) : (
        <ul className="divide-y rounded-lg border" aria-label="Notifications">
          {items.map((n) => (
            <li key={n.id} className="flex items-start gap-2 px-3 py-2.5">
              {n.link ? (
                <Link href={`/app/${orgSlug}/${n.link}`} className="min-w-0 flex-1 hover:underline">
                  <NotificationItem notification={n} />
                </Link>
              ) : (
                <div className="min-w-0 flex-1">
                  <NotificationItem notification={n} />
                </div>
              )}
              {!n.read_at ? <MarkReadButton orgSlug={orgSlug} id={n.id} /> : null}
            </li>
          ))}
        </ul>
      )}

      {isAdmin(ctx.role) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Due-date reminders</CardTitle>
            <CardDescription>
              Once a day, PermitFlow reminds assignees about permits expiring in{" "}
              {EXPIRY_THRESHOLDS.join(", ")} days and about overdue tasks. Each reminder is sent
              once. Admins can run the check now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RunDueCheckButton orgSlug={orgSlug} />
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
