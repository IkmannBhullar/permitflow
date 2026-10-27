"use server"

import { revalidatePath } from "next/cache"

import { ADMIN_ROLES, EDIT_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"

import {
  changeStatusSchema,
  createPermitSchema,
  deletePermitSchema,
  updatePermitSchema,
} from "./schemas"
import { buildStatusPatch } from "./transitions"

const nullIfBlank = (v: string) => (v === "" ? null : v)

export const createPermit = orgAction(
  { name: "createPermit", schema: createPermitSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, input) => {
    const { data, error } = await supabase
      .from("permits")
      .insert({
        ...input,
        org_id: org.id,
        application_number: nullIfBlank(input.application_number),
        approved_at: input.status === "approved" ? input.approved_at : null,
      })
      .select("id")
      .single()
    if (error) return fail(reportError("createPermit", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok({ id: data.id })
  }
)

export const updatePermit = orgAction(
  { name: "updatePermit", schema: updatePermitSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, { id, ...values }) => {
    const { data, error } = await supabase
      .from("permits")
      .update({ ...values, application_number: nullIfBlank(values.application_number) })
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id")
    if (error) return fail(reportError("updatePermit", error))
    if (!data.length) return fail("We couldn't find that permit.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const changePermitStatus = orgAction(
  { name: "changePermitStatus", schema: changeStatusSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, { id, ...next }) => {
    const { data: current, error: readError } = await supabase
      .from("permits")
      .select("status")
      .eq("id", id)
      .eq("org_id", org.id)
      .maybeSingle()
    if (readError) return fail(reportError("changePermitStatus", readError))
    if (!current) return fail("We couldn't find that permit.")

    const result = buildStatusPatch(current.status, next)
    if (!result.ok) return fail(result.error, { approved_at: [result.error] })

    const { error } = await supabase
      .from("permits")
      .update(result.patch)
      .eq("id", id)
      .eq("org_id", org.id)
    if (error) return fail(reportError("changePermitStatus", error))
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok()
  }
)

export const deletePermit = orgAction(
  { name: "deletePermit", schema: deletePermitSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { id }) => {
    const { data, error } = await supabase
      .from("permits")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id)
      .select("project_id")
    if (error) return fail(reportError("deletePermit", error))
    if (!data.length) return fail("We couldn't find that permit.")
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok({ projectId: data[0]!.project_id })
  }
)
