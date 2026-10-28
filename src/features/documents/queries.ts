import "server-only"

import { reportError } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type DocumentRow = Tables<"documents"> & {
  project: { id: string; name: string }
  permit: { id: string; name: string } | null
  versions: Pick<
    Tables<"document_versions">,
    "id" | "version" | "size_bytes" | "mime_type" | "created_at" | "uploaded_by"
  >[]
}

const SELECT =
  "*, project:projects!inner(id, name), permit:permits(id, name), versions:document_versions(id, version, size_bytes, mime_type, created_at, uploaded_by)"

export async function listDocuments(
  orgId: string,
  scope: { projectId?: string; permitId?: string } = {}
): Promise<DocumentRow[]> {
  const supabase = await createClient()
  let query = supabase.from("documents").select(SELECT).eq("org_id", orgId)
  if (scope.projectId) query = query.eq("project_id", scope.projectId)
  if (scope.permitId) query = query.eq("permit_id", scope.permitId)
  const { data, error } = await query.order("updated_at", { ascending: false })
  if (error) throw new Error(reportError("listDocuments", error))
  return data.map((d) => ({
    ...d,
    versions: [...d.versions].sort((a, b) => b.version - a.version),
  }))
}

export async function getDocument(orgId: string, documentId: string): Promise<DocumentRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT)
    .eq("org_id", orgId)
    .eq("id", documentId)
    .maybeSingle()
  if (error) {
    if (error.code === "22P02") return null
    throw new Error(reportError("getDocument", error))
  }
  return data
    ? { ...data, versions: [...data.versions].sort((a, b) => b.version - a.version) }
    : null
}

/** A short-lived signed URL for viewing a version inline. Storage RLS checks org membership. */
export async function signedPreviewUrl(
  orgId: string,
  versionId: string,
  expiresIn = 300
): Promise<string | null> {
  const supabase = await createClient()
  const { data: version } = await supabase
    .from("document_versions")
    .select("storage_path")
    .eq("org_id", orgId)
    .eq("id", versionId)
    .maybeSingle()
  if (!version) return null
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(version.storage_path, expiresIn)
  if (error) {
    reportError("signedPreviewUrl", error)
    return null
  }
  return data.signedUrl
}
