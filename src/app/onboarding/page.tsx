import type { Metadata } from "next"
import Link from "next/link"

import { Disclaimer } from "@/components/disclaimer"
import { Logo } from "@/components/logo"
import { CreateOrgForm } from "@/features/orgs/components/create-org-form"
import { listMyOrgs } from "@/features/orgs/queries"

export const metadata: Metadata = { title: "Create your organization" }

export default async function OnboardingPage() {
  const orgs = await listMyOrgs()
  const isFirst = orgs.length === 0

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-12">
      <Logo />
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xs sm:p-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {isFirst ? "Set up your company" : "Create another organization"}
          </h1>
          <p className="text-sm text-muted-foreground">
            An organization holds your projects, permits and team. You&apos;ll be its admin and can
            invite teammates next.
          </p>
        </div>
        <CreateOrgForm />
        {!isFirst ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/app" className="underline-offset-4 hover:underline">
              Back to {orgs[0]!.name}
            </Link>
          </p>
        ) : null}
      </div>
      <Disclaimer className="max-w-md text-center" />
    </div>
  )
}
