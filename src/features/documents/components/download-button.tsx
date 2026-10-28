"use client"

import { DownloadIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { getDocumentUrl } from "../actions"

/** Fetches a 60-second signed URL on click, so links never sit around in the page. */
export function DownloadButton({
  orgSlug,
  versionId,
  label = "Download",
  iconOnly = false,
}: {
  orgSlug: string
  versionId: string
  label?: string
  iconOnly?: boolean
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon-sm" : "sm"}
      disabled={pending}
      aria-label={iconOnly ? label : undefined}
      onClick={() =>
        startTransition(async () => {
          const result = await getDocumentUrl(orgSlug, { versionId, download: true })
          if (!result.ok) return void toast.error(result.error)
          window.location.assign(result.data.url)
        })
      }
    >
      <DownloadIcon />
      {iconOnly ? null : label}
    </Button>
  )
}
