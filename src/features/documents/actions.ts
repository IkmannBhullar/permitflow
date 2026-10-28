"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"

import { ADMIN_ROLES, EDIT_ROLES, ORG_ROLES } from "@/features/orgs/roles"
import { fail, ok } from "@/lib/action-result"
import { orgAction } from "@/lib/actions"
import { reportError } from "@/lib/errors"

import { ALLOWED_TYPES, MAX_FILE_BYTES, storagePath, validateFile } from "./files"
import {
  deleteDocumentSchema,
  documentUrlSchema,
  finalizeUploadSchema,
  prepareUploadSchema,
} from "./schemas"

/**
 * Step 1 of an upload: validate the file and issue a signed upload URL for its canonical path.
 * Files go straight from the browser to Storage (serverless request bodies are capped at 4.5 MB).
 */
export const prepareUpload = orgAction(
  { name: "prepareUpload", schema: prepareUploadSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, input) => {
    const invalidFile = validateFile({
      name: input.fileName,
      size: input.size,
      type: input.mimeType,
    })
    if (invalidFile) return fail(invalidFile)

    let documentId = input.documentId
    let version = 1
    if (documentId) {
      const { data: doc, error } = await supabase
        .from("documents")
        .select("current_version, project_id")
        .eq("id", documentId)
        .eq("org_id", org.id)
        .maybeSingle()
      if (error) return fail(reportError("prepareUpload", error))
      if (!doc || doc.project_id !== input.projectId) return fail("We couldn't find that document.")
      version = doc.current_version + 1
    } else {
      const { data: project } = await supabase
        .from("projects")
        .select("id, status")
        .eq("id", input.projectId)
        .eq("org_id", org.id)
        .maybeSingle()
      if (!project) return fail("We couldn't find that project.")
      if (project.status === "archived") return fail("Archived projects are read-only.")
      documentId = randomUUID()
    }

    const path = storagePath(org.id, input.projectId, documentId, version, input.fileName)
    const { data, error } = await supabase.storage.from("documents").createSignedUploadUrl(path)
    if (error)
      return fail(reportError("prepareUpload", error, "We couldn't start the upload. Try again."))
    return ok({ path, token: data.token, documentId, version })
  }
)

/**
 * Step 2: after the browser uploads, re-read the object's real size and type from Storage
 * (never trusting the client), then record the document and version.
 */
export const finalizeUpload = orgAction(
  { name: "finalizeUpload", schema: finalizeUploadSchema, roles: EDIT_ROLES },
  async ({ supabase, org }, input) => {
    const expectedPrefix = `${org.id}/${input.projectId}/${input.documentId}/v${input.version}/`
    if (
      !input.path.startsWith(expectedPrefix) ||
      input.path.slice(expectedPrefix.length).includes("/")
    ) {
      return fail("That upload doesn't match this document.")
    }

    const { data: info, error: infoError } = await supabase.storage
      .from("documents")
      .info(input.path)
    if (infoError || !info) return fail("We couldn't find the uploaded file. Try uploading again.")
    const size = info.size ?? 0
    const mime = info.contentType ?? ""
    if (!ALLOWED_TYPES[mime] || size <= 0 || size > MAX_FILE_BYTES) {
      return fail("The uploaded file isn't an allowed type or size.")
    }

    if (input.version === 1) {
      const { error } = await supabase.from("documents").insert({
        id: input.documentId,
        org_id: org.id,
        project_id: input.projectId,
        permit_id: input.permitId,
        name: input.name,
      })
      if (error) return fail(reportError("finalizeUpload", error))
    }
    const { error } = await supabase.from("document_versions").insert({
      document_id: input.documentId,
      org_id: org.id,
      version: input.version,
      storage_path: input.path,
      size_bytes: size,
      mime_type: mime,
    })
    if (error) {
      if (error.code === "23505")
        return fail("Someone else uploaded a new version at the same time. Refresh and try again.")
      return fail(reportError("finalizeUpload", error))
    }

    revalidatePath(`/app/${org.slug}`, "layout")
    return ok({ documentId: input.documentId })
  }
)

/** A 60-second signed URL. With `download`, the browser saves the file instead of opening it. */
export const getDocumentUrl = orgAction(
  { name: "getDocumentUrl", schema: documentUrlSchema, roles: ORG_ROLES },
  async ({ supabase, org }, { versionId, download }) => {
    const { data: version } = await supabase
      .from("document_versions")
      .select("storage_path")
      .eq("id", versionId)
      .eq("org_id", org.id)
      .maybeSingle()
    if (!version) return fail("We couldn't find that file.")
    const fileName = version.storage_path.split("/").at(-1)!
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(version.storage_path, 60, download ? { download: fileName } : undefined)
    if (error) return fail(reportError("getDocumentUrl", error))
    return ok({ url: data.signedUrl })
  }
)

export const deleteDocument = orgAction(
  { name: "deleteDocument", schema: deleteDocumentSchema, roles: ADMIN_ROLES },
  async ({ supabase, org }, { id }) => {
    const { data: versions, error: readError } = await supabase
      .from("document_versions")
      .select("storage_path")
      .eq("document_id", id)
      .eq("org_id", org.id)
    if (readError) return fail(reportError("deleteDocument", readError))

    const { data, error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id)
      .select("project_id")
    if (error) return fail(reportError("deleteDocument", error))
    if (!data.length) return fail("We couldn't find that document.")

    // Remove the files after the rows so a failure never leaves rows pointing at missing files.
    const paths = versions.map((v) => v.storage_path)
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("documents").remove(paths)
      if (storageError) reportError("deleteDocument:storage", storageError)
    }
    revalidatePath(`/app/${org.slug}`, "layout")
    return ok({ projectId: data[0]!.project_id })
  }
)
