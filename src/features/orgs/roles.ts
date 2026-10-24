import type { Database } from "@/lib/supabase/database.types"

export type OrgRole = Database["public"]["Enums"]["org_role"]

export const ORG_ROLES: OrgRole[] = ["admin", "project_manager", "viewer"]

export const ROLE_LABELS: Record<OrgRole, string> = {
  admin: "Admin",
  project_manager: "Project manager",
  viewer: "Viewer",
}

export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  admin: "Everything, plus members, invites, settings and deletes.",
  project_manager: "Create and edit projects, permits, tasks, documents and comments.",
  viewer: "Read-only access to everything in the organization.",
}

export const EDIT_ROLES: OrgRole[] = ["admin", "project_manager"]
export const ADMIN_ROLES: OrgRole[] = ["admin"]

export const canEdit = (role: OrgRole) => EDIT_ROLES.includes(role)
export const isAdmin = (role: OrgRole) => role === "admin"
