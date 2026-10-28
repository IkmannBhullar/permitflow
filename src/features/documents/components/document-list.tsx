import { FileIcon, FileImageIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import { formatDate } from "@/lib/dates"

import { formatBytes } from "../files"
import type { DocumentRow } from "../queries"
import { DownloadButton } from "./download-button"

function iconFor(mime: string) {
  if (mime === "application/pdf") return FileTextIcon
  if (mime.startsWith("image/")) return FileImageIcon
  return FileIcon
}

export function DocumentList({
  documents,
  orgSlug,
  names,
  showProject = false,
  showPermit = true,
  action,
}: {
  documents: DocumentRow[]
  orgSlug: string
  names: Record<string, string>
  showProject?: boolean
  showPermit?: boolean
  action?: React.ReactNode
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="No documents yet"
        description={
          action
            ? "Upload plans, correction letters or approvals so the team has one copy."
            : "Nothing has been uploaded yet."
        }
        action={action}
      />
    )
  }
  return (
    <ul className="divide-y rounded-lg border">
      {documents.map((d) => {
        const latest = d.versions[0]
        const Icon = iconFor(latest?.mime_type ?? "")
        return (
          <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <Link
                href={`/app/${orgSlug}/documents/${d.id}`}
                className="font-medium hover:underline"
              >
                {d.name}
              </Link>
              <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                <span>v{d.current_version}</span>
                {latest ? <span>{formatBytes(latest.size_bytes)}</span> : null}
                {latest ? (
                  <span>
                    {formatDate(latest.created_at)}
                    {latest.uploaded_by
                      ? ` by ${names[latest.uploaded_by] ?? "a former member"}`
                      : ""}
                  </span>
                ) : null}
                {showProject ? (
                  <Link
                    href={`/app/${orgSlug}/projects/${d.project.id}`}
                    className="hover:underline"
                  >
                    {d.project.name}
                  </Link>
                ) : null}
                {showPermit && d.permit ? (
                  <Link href={`/app/${orgSlug}/permits/${d.permit.id}`} className="hover:underline">
                    {d.permit.name}
                  </Link>
                ) : null}
              </p>
            </div>
            {latest ? (
              <DownloadButton
                orgSlug={orgSlug}
                versionId={latest.id}
                label={`Download ${d.name}`}
                iconOnly
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
