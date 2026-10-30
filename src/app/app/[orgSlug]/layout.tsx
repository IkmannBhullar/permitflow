import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { DemoBanner } from "@/components/app-shell/demo-banner"
import { UserMenu } from "@/components/app-shell/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { listNotifications } from "@/features/notifications/queries"
import { getMyProfile, listMyOrgs } from "@/features/orgs/queries"
import { getOrgContext } from "@/lib/actions"

export default async function OrgLayout({ children, params }: LayoutProps<"/app/[orgSlug]">) {
  const { orgSlug } = await params
  const [ctx, orgs, profile, cookieStore] = await Promise.all([
    getOrgContext(orgSlug),
    listMyOrgs(),
    getMyProfile(),
    cookies(),
  ])
  if (!profile) redirect(`/login?next=/app/${orgSlug}/dashboard`)
  if (!ctx) notFound()

  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"
  const notifications = await listNotifications(ctx.org.id, ctx.userId, { limit: 8 })

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar orgs={orgs} currentSlug={ctx.org.slug} />
      <SidebarInset className="min-w-0">
        {ctx.org.is_demo ? <DemoBanner /> : null}
        <header
          data-print="hide"
          className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80"
        >
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4!" />
          <span className="truncate text-sm font-medium">{ctx.org.name}</span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell
              orgSlug={ctx.org.slug}
              items={notifications.items}
              unread={notifications.unread}
            />
            <ThemeToggle />
            <UserMenu name={profile.full_name} email={profile.email} />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
