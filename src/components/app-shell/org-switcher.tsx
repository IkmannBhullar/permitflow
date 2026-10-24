"use client"

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import type { MyOrg } from "@/features/orgs/queries"
import { ROLE_LABELS } from "@/features/orgs/roles"

function OrgAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function OrgSwitcher({ orgs, currentSlug }: { orgs: MyOrg[]; currentSlug: string }) {
  const current = orgs.find((o) => o.slug === currentSlug) ?? orgs[0]
  if (!current) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              aria-label={`Current organization: ${current.name}. Switch organization`}
            >
              <OrgAvatar name={current.name} />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{current.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[current.role]}
                </span>
              </span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            align="start"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem key={org.id} asChild>
                <Link href={`/app/${org.slug}/dashboard`}>
                  <OrgAvatar name={org.name} />
                  <span className="flex-1 truncate">{org.name}</span>
                  {org.slug === current.slug ? <CheckIcon aria-label="Current" /> : null}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/onboarding">
                <PlusIcon /> Create organization
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
