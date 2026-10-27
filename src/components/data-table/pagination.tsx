import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function PaginationBar({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number
  pageSize: number
  total: number
  hrefFor: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 text-sm text-muted-foreground"
    >
      <p aria-live="polite">{total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}</p>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">
          Page {Math.min(page, pages)} of {pages}
        </span>
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefFor(page - 1)} scroll={false}>
              <ChevronLeftIcon /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeftIcon /> Previous
          </Button>
        )}
        {page < pages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefFor(page + 1)} scroll={false}>
              Next <ChevronRightIcon />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRightIcon />
          </Button>
        )}
      </div>
    </nav>
  )
}
