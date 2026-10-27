"use server"

import { revalidatePath } from "next/cache"

import { ADMIN_ROLES, EDIT_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"

import { archiveProjectSchema, projectSchema, updateProjectSchema } from "./schemas"

export const createProject = orgAction(
  { name: "createProject", schema: projectSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, input) => {
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...input, org_id: org.id })
      .select("id")
      .single()
    if (error) return fail(reportError("createProject", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok({ id: data.id })
  }
)

export const updateProject = orgAction(
  { name: "updateProject", schema: updateProjectSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, { id, ...values }) => {
    const { data, error } = await supabase
      .from("projects")
      .update(values)
      .eq("id", id)
      .eq("org_id", org.id)
      .neq("status", "archived")
      .select("id")
    if (error) return fail(reportError("updateProject", error))
    if (!data.length) return fail("This project can't be edited. It may be archived or deleted.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const setProjectArchived = orgAction(
  { name: "setProjectArchived", schema: archiveProjectSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { id, archived }) => {
    const { data, error } = await supabase
      .from("projects")
      .update({ status: archived ? "archived" : "active" })
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id")
    if (error) return fail(reportError("setProjectArchived", error))
    if (!data.length) return fail("We couldn't find that project.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)
