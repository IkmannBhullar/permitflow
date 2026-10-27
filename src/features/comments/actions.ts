"use server"

import { revalidatePath } from "next/cache"

import { EDIT_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"

import { addCommentSchema, deleteCommentSchema } from "./schemas"

export const addComment = orgAction(
  { name: "addComment", schema: addCommentSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, input) => {
    const { error } = await supabase.from("comments").insert({ ...input, org_id: org.id })
    if (error) return fail(reportError("addComment", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

/** Authors can delete their own comments and admins can delete any; RLS enforces both. */
export const deleteComment = orgAction(
  { name: "deleteComment", schema: deleteCommentSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, { id }) => {
    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id")
    if (error) return fail(reportError("deleteComment", error))
    if (!data.length) return fail("You can only delete your own comments.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)
