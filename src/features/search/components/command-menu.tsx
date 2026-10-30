"use client"

import { FileCheck2Icon, FolderKanbanIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { NAV_ITEMS } from "@/components/app-shell/nav"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { PermitStatusBadge } from "@/features/permits/components/permit-status-badge"

import { searchOrg, type SearchResults } from "../actions"

const EMPTY: SearchResults = { projects: [], permits: [] }

export function CommandMenu({ orgSlug }: { orgSlug: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  // Controlled highlight: each new result set starts on its first item, so Enter never
  // opens something from the previous query.
  const [highlighted, setHighlighted] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      const result = await searchOrg(orgSlug, { q })
      if (cancelled) return
      setLoading(false)
      const next = result.ok ? result.data : EMPTY
      setResults(next)
      const first = next.projects[0]
        ? `project-${next.projects[0].id}`
        : next.permits[0]
          ? `permit-${next.permits[0].id}`
          : ""
      setHighlighted(first)
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, orgSlug])

  const go = (path: string) => {
    setOpen(false)
    setQuery("")
    setResults(EMPTY)
    router.push(`/app/${orgSlug}/${path}`)
  }
  const searching = query.trim().length >= 2

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-9 justify-start gap-2 px-2 text-muted-foreground sm:w-56"
        onClick={() => setOpen(true)}
      >
        <SearchIcon aria-hidden />
        <span className="sr-only sm:not-sr-only">Search projects and permits</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-foreground sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search projects and permits, or jump to a page."
      >
        <Command shouldFilter={false} value={highlighted} onValueChange={setHighlighted}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search projects, permits, application #…"
          />
          <CommandList>
            {searching ? (
              <>
                <CommandEmpty>
                  {loading ? "Searching…" : "No matching projects or permits."}
                </CommandEmpty>
                {results.projects.length ? (
                  <CommandGroup heading="Projects">
                    {results.projects.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`project-${p.id}`}
                        onSelect={() => go(`projects/${p.id}`)}
                      >
                        <FolderKanbanIcon aria-hidden />
                        <span className="truncate">{p.name}</span>
                        <span className="ml-auto truncate text-xs text-foreground/70">
                          {p.detail}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {results.permits.length ? (
                  <CommandGroup heading="Permits">
                    {results.permits.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`permit-${p.id}`}
                        onSelect={() => go(`permits/${p.id}`)}
                      >
                        <FileCheck2Icon aria-hidden />
                        <span className="min-w-0 flex-1 truncate">
                          {p.name}
                          <span className="block truncate text-xs text-foreground/70">
                            {p.detail}
                          </span>
                        </span>
                        <PermitStatusBadge status={p.status} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
              </>
            ) : (
              <CommandGroup heading="Go to">
                {NAV_ITEMS.map((item) => (
                  <CommandItem
                    key={item.segment}
                    value={item.segment}
                    onSelect={() => go(item.segment)}
                  >
                    <item.icon aria-hidden />
                    {item.title}
                    <CommandShortcut>↵</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
