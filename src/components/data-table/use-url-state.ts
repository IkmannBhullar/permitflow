"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

/** Reads and writes query-string state. Changing any filter resets pagination. */
export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const setParams = useCallback(
    (updates: Record<string, string | null>, { resetPage = true } = {}) => {
      // Read the live URL, not the render-time snapshot: a debounced update (search box)
      // must not undo a change made in between (e.g. a sort click).
      const next = new URLSearchParams(window.location.search)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      if (resetPage) next.delete("page")
      const qs = next.toString()
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
    },
    [router, pathname]
  )

  return { searchParams, setParams, pending }
}
