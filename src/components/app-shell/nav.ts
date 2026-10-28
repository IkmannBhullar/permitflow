import {
  FileCheck2Icon,
  FileTextIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  ChartColumnIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; segment: string; icon: LucideIcon }

/**
 * Sidebar destinations. An item is listed only once its page works end to end
 * (no placeholder links). Order matches the brief: Dashboard, Projects, Permits,
 * Tasks, Documents, Reports, Team, Settings.
 */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", segment: "dashboard", icon: LayoutDashboardIcon },
  { title: "Projects", segment: "projects", icon: FolderKanbanIcon },
  { title: "Permits", segment: "permits", icon: FileCheck2Icon },
  { title: "Tasks", segment: "tasks", icon: ListTodoIcon },
  { title: "Documents", segment: "documents", icon: FileTextIcon },
  { title: "Reports", segment: "reports", icon: ChartColumnIcon },
  { title: "Team", segment: "team", icon: UsersIcon },
  { title: "Settings", segment: "settings", icon: SettingsIcon },
]
