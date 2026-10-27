import type { Metadata } from "next"

import { Separator } from "@/components/ui/separator"
import { DemoLoginButton } from "@/features/auth/components/demo-login-button"
import { LoginForm } from "@/features/auth/components/login-form"
import { isDemoConfigured } from "@/lib/env.server"

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
      {isDemoConfigured() ? (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> or <Separator className="flex-1" />
          </div>
          <DemoLoginButton variant="outline" className="w-full" />
        </>
      ) : null}
    </div>
  )
}
