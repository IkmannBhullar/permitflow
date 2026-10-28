import { ExternalLinkIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteDocumentButton } from "@/features/documents/components/delete-document-button"
import { DownloadButton } from "@/features/documents/components/download-button"
import { UploadDocumentDialog } from "@/features/documents/components/upload-dialog"
import { ALLOWED_TYPES, formatBytes, isPreviewable } from "@/features/documents/files"
import { getDocument, signedPreviewUrl } from "@/features/documents/queries"
import { canEdit, isAdmin } from "@/features/orgs/roles"
import { listMembers, memberNames } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { formatDateTime } from "@/lib/dates"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: PageProps<"/app/[orgSlug]/documents/[documentId]">): Promise<Metadata> {
  const { orgSlug, documentId } = await params
  const ctx = await getOrgContext(orgSlug)
  const doc = ctx ? await getDocument(ctx.org.id, documentId) : null
  return { title: doc?.name ?? "Document" }
}

export default async function DocumentPage({
  params,
  searchParams,
}: PageProps<"/app/[orgSlug]/documents/[documentId]">) {
  const [{ orgSlug, documentId }, { v }] = await Promise.all([params, searchParams])
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const [doc, members] = await Promise.all([
    getDocument(ctx.org.id, documentId),
    listMembers(ctx.org.id),
  ])
  if (!doc || doc.versions.length === 0) notFound()

  const names = memberNames(members)
  const selected = doc.versions.find((x) => x.id === v) ?? doc.versions[0]!
  const previewUrl = isPreviewable(selected.mime_type)
    ? await signedPreviewUrl(ctx.org.id, selected.id)
    : null
  const base = `/app/${orgSlug}`

  return (
    <>
      <div className="space-y-2">
        <Link
          href={
            doc.permit ? `${base}/permits/${doc.permit.id}` : `${base}/projects/${doc.project.id}`
          }
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {doc.permit?.name ?? doc.project.name}
        </Link>
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {doc.name} <Badge variant="secondary">v{doc.current_version}</Badge>
            </span>
          }
          description={
            <>
              <Link href={`${base}/projects/${doc.project.id}`} className="hover:underline">
                {doc.project.name}
              </Link>
              {doc.permit ? (
                <>
                  {" · "}
                  <Link href={`${base}/permits/${doc.permit.id}`} className="hover:underline">
                    {doc.permit.name}
                  </Link>
                </>
              ) : null}
            </>
          }
          actions={
            <>
              <DownloadButton
                orgSlug={orgSlug}
                versionId={selected.id}
                label={`Download v${selected.version}`}
              />
              {canEdit(ctx.role) ? (
                <UploadDocumentDialog
                  mode="version"
                  orgSlug={orgSlug}
                  documentId={doc.id}
                  documentName={doc.name}
                  projectId={doc.project_id}
                  permitId={doc.permit_id}
                />
              ) : null}
              {isAdmin(ctx.role) ? (
                <DeleteDocumentButton orgSlug={orgSlug} documentId={doc.id} />
              ) : null}
            </>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Preview: version {selected.version}</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl && selected.mime_type === "application/pdf" ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="h-[70vh] w-full rounded-md border"
                aria-label={`${doc.name}, version ${selected.version}`}
              >
                <p className="p-4 text-sm text-muted-foreground">
                  Your browser can&apos;t show PDFs inline.{" "}
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="underline">
                    Open the PDF
                  </a>
                  .
                </p>
              </object>
            ) : previewUrl ? (
              // Signed, expiring Storage URL: next/image would need the Supabase host whitelisted and would cache it.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={`${doc.name}, version ${selected.version}`}
                className="max-h-[70vh] w-full rounded-md border object-contain"
              />
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                <p>
                  {ALLOWED_TYPES[selected.mime_type]?.label ?? "This file type"} can&apos;t be
                  previewed in the browser. Download it to open it.
                </p>
                <DownloadButton orgSlug={orgSlug} versionId={selected.id} />
              </div>
            )}
            {previewUrl ? (
              <p className="mt-2 text-xs text-muted-foreground">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Open in a new tab <ExternalLinkIcon className="size-3" aria-hidden />
                </a>{" "}
                · Preview links expire after 5 minutes. Reload the page for a fresh one.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Version history</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1">
              {doc.versions.map((version) => (
                <li key={version.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                      version.id === selected.id && "bg-muted"
                    )}
                  >
                    <Link
                      href={`${base}/documents/${doc.id}?v=${version.id}`}
                      aria-current={version.id === selected.id ? "true" : undefined}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <span className="font-medium">Version {version.version}</span>
                      {version.version === doc.current_version ? " (latest)" : ""}
                      <span className="block text-xs text-muted-foreground">
                        {formatDateTime(version.created_at)} · {formatBytes(version.size_bytes)}
                        {version.uploaded_by
                          ? ` · ${names[version.uploaded_by] ?? "former member"}`
                          : ""}
                      </span>
                    </Link>
                    <DownloadButton
                      orgSlug={orgSlug}
                      versionId={version.id}
                      label={`Download version ${version.version}`}
                      iconOnly
                    />
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
