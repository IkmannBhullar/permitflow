"use server"

import { revalidatePath } from "next/cache"

import { ADMIN_ROLES, EDIT_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"

import { deleteTaskSchema, setTaskDoneSchema, taskSchema, updateTaskSchema } from "./schemas"

export const createTask = orgAction(
  { name: "createTask", schema: taskSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, input) => {
    const { error } = await supabase.from("tasks").insert({ ...input, org_id: org.id })
    if (error) return fail(reportError("createTask", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const updateTask = orgAction(
  { name: "updateTask", schema: updateTaskSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, { id, ...values }) => {
    const { data, error } = await supabase
      .from("tasks")
      .update(values)
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id")
    if (error) return fail(reportError("updateTask", error))
    if (!data.length) return fail("We couldn't find that task.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const setTaskDone = orgAction(
  { name: "setTaskDone", schema: setTaskDoneSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, { id, done }) => {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: done ? "done" : "todo" })
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id")
    if (error) return fail(reportError("setTaskDone", error))
    if (!data.length) return fail("We couldn't find that task.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const deleteTask = orgAction(
  { name: "deleteTask", schema: deleteTaskSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { id }) => {
    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id")
    if (error) return fail(reportError("deleteTask", error))
    if (!data.length) return fail("We couldn't find that task.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)
