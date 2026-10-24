import { LayoutDashboardIcon, type LucideIcon } from "lucide-react"

export type NavItem = { title: string; segment: string; icon: LucideIcon }

/**
 * Sidebar destinations. An item is listed only once its page works end to end
 * (no placeholder links). Order matches the brief: Dashboard, Projects, Permits,
 * Tasks, Documents, Reports, Team, Settings.
 */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", segment: "dashboard", icon: LayoutDashboardIcon },
]
