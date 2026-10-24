import type { Metadata } from "next"

import { SignupForm } from "@/features/auth/components/signup-form"

export const metadata: Metadata = { title: "Sign up" }

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next, email } = await searchParams
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Track every permit across every project.</p>
      </div>
      <SignupForm
        next={typeof next === "string" ? next : undefined}
        email={typeof email === "string" ? email : undefined}
      />
    </div>
  )
}
