import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been moved or deleted, or you may not have access to it.
      </p>
      <Button asChild variant="outline">
        <Link href="/app">Go to your dashboard</Link>
      </Button>
    </div>
  )
}
