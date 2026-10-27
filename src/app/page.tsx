import { BellRingIcon, ClipboardCheckIcon, FolderKanbanIcon, TimerIcon } from "lucide-react"
import Link from "next/link"

import { Disclaimer } from "@/components/disclaimer"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { DemoLoginButton } from "@/features/auth/components/demo-login-button"
import { isDemoConfigured } from "@/lib/env.server"

const FEATURES = [
  {
    icon: FolderKanbanIcon,
    title: "Every permit, every project",
    body: "One place for building, electrical, plumbing and more, with status and owners.",
  },
  {
    icon: TimerIcon,
    title: "Nothing expires quietly",
    body: "See what's expiring, stalled in review or waiting on corrections.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Corrections, handled",
    body: "Turn reviewer comments into assigned tasks with due dates.",
  },
  {
    icon: BellRingIcon,
    title: "The team stays in sync",
    body: "Activity history on every permit, plus in-app notifications.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-4 py-12">
        <div className="max-w-2xl space-y-5">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Permit tracking for builders who can&apos;t afford surprises.
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">
            PermitFlow gives construction teams a shared, live view of every permit across every
            project: what&apos;s pending, what needs corrections, and what&apos;s about to expire.
          </p>
          <div className="flex flex-wrap gap-3">
            {isDemoConfigured() ? <DemoLoginButton size="lg" /> : null}
            <Button asChild size="lg" variant={isDemoConfigured() ? "outline" : "default"}>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
          {isDemoConfigured() ? (
            <p className="text-sm text-muted-foreground">
              The demo signs you in as a project manager at a fictional builder. No account needed.
            </p>
          ) : null}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="space-y-2 rounded-lg border p-4">
              <f.icon className="size-5 text-muted-foreground" aria-hidden />
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </li>
          ))}
        </ul>
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 py-6">
        <Disclaimer />
      </footer>
    </div>
  )
}
