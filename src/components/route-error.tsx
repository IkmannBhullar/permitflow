"use client"

import { AlertTriangleIcon, RotateCwIcon } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

/** Shared body for error.tsx boundaries. Never renders the raw error message. */
export function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
      role="alert"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangleIcon className="size-5 text-destructive" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">Something went wrong loading this page.</p>
        <p className="text-sm text-muted-foreground">
          It may be a temporary problem. Try again, and if it keeps happening, reload the page.
        </p>
      </div>
      <Button variant="outline" onClick={() => retry()}>
        <RotateCwIcon /> Try again
      </Button>
    </div>
  )
}
