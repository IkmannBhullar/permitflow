import type { Metadata } from "next"

import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = { title: "Log in" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Pick up where you left off.</p>
      </div>
      {error === "confirmation" ? (
        <p className="text-sm text-destructive" role="alert">
          That confirmation link is invalid or has expired. Log in or sign up again.
        </p>
      ) : null}
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  )
}
