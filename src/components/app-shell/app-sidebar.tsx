"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import type { MyOrg } from "@/features/orgs/queries"

import { NAV_ITEMS } from "./nav"
import { OrgSwitcher } from "./org-switcher"

export function AppSidebar({ orgs, currentSlug }: { orgs: MyOrg[]; currentSlug: string }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const base = `/app/${currentSlug}`

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher orgs={orgs} currentSlug={currentSlug} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const href = `${base}/${item.segment}`
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <SidebarMenuItem key={item.segment}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="px-2 text-[11px] leading-snug text-muted-foreground">
          PermitFlow tracks permits. It does not submit to or verify with government agencies.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
