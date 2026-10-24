import type { Metadata } from "next"
import Link from "next/link"

import { Disclaimer } from "@/components/disclaimer"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { getMyProfile } from "@/features/orgs/queries"
import { LogoutButton } from "@/features/auth/components/logout-button"
import { ROLE_LABELS } from "@/features/orgs/roles"
import { AcceptInviteButton } from "@/features/team/components/accept-invite-button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Join organization" }

const STATUS_MESSAGES: Record<string, string> = {
  expired: "This invite has expired. Ask your admin for a new link.",
  accepted: "This invite has already been used.",
  revoked: "This invite was revoked. Ask your admin for a new link.",
}

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params
  const supabase = await createClient()
  const [{ data }, profile] = await Promise.all([
    supabase.rpc("get_invite", { p_token: token }),
    getMyProfile(),
  ])
  const invite = data?.[0]
  const here = `/invite/${encodeURIComponent(token)}`

  let body: React.ReactNode
  if (!invite) {
    body = (
      <p className="text-sm text-muted-foreground">
        This invite link is invalid. Check that you copied the whole link.
      </p>
    )
  } else if (invite.status !== "valid") {
    body = <p className="text-sm text-muted-foreground">{STATUS_MESSAGES[invite.status]}</p>
  } else if (!profile) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Log in or create an account with{" "}
          <span className="font-medium text-foreground">{invite.email}</span> to accept.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link
              href={`/signup?next=${encodeURIComponent(here)}&email=${encodeURIComponent(invite.email)}`}
            >
              Create account
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/login?next=${encodeURIComponent(here)}`}>Log in</Link>
          </Button>
        </div>
      </div>
    )
  } else if (profile.email !== invite.email) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This invite is for <span className="font-medium text-foreground">{invite.email}</span>,
          but you&apos;re signed in as{" "}
          <span className="font-medium text-foreground">{profile.email}</span>. Log out and sign in
          with the invited address to accept.
        </p>
        <LogoutButton className="w-full" />
      </div>
    )
  } else {
    body = <AcceptInviteButton token={token} orgName={invite.org_name} />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-12">
      <Logo />
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-xs sm:p-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {invite ? `Join ${invite.org_name}` : "Invite not found"}
          </h1>
          {invite && invite.status === "valid" ? (
            <p className="text-sm text-muted-foreground">
              You&apos;ve been invited as {ROLE_LABELS[invite.role].toLowerCase()}.
            </p>
          ) : null}
        </div>
        {body}
      </div>
      <Disclaimer className="max-w-sm text-center" />
    </div>
  )
}
