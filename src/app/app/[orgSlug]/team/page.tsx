import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isAdmin, ROLE_LABELS } from "@/features/orgs/roles"
import { InviteDialog } from "@/features/team/components/invite-dialog"
import { RemoveMemberButton, RevokeInviteButton } from "@/features/team/components/member-buttons"
import { MemberRoleSelect } from "@/features/team/components/member-role-select"
import { listMembers, listPendingInvites } from "@/features/team/queries"
import { getOrgContext } from "@/lib/actions"
import { formatDate } from "@/lib/dates"
import { initials } from "@/lib/initials"

export const metadata: Metadata = { title: "Team" }

export default async function TeamPage({ params }: PageProps<"/app/[orgSlug]/team">) {
  const { orgSlug } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()
  const admin = isAdmin(ctx.role)
  const [members, invites] = await Promise.all([
    listMembers(ctx.org.id),
    admin ? listPendingInvites(ctx.org.id) : Promise.resolve([]),
  ])

  return (
    <>
      <PageHeader
        title="Team"
        description={
          admin ? "Invite teammates and manage what they can do." : "Everyone in this organization."
        }
        actions={admin ? <InviteDialog orgSlug={orgSlug} /> : null}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => {
              const name = m.full_name || m.email
              const isSelf = m.user_id === ctx.userId
              return (
                <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {name} {isSelf ? <span className="text-muted-foreground">(you)</span> : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email} · joined {formatDate(m.created_at)}
                    </p>
                  </div>
                  {admin ? (
                    <div className="flex items-center gap-1">
                      <MemberRoleSelect
                        orgSlug={orgSlug}
                        userId={m.user_id}
                        name={name}
                        role={m.role}
                      />
                      <RemoveMemberButton
                        orgSlug={orgSlug}
                        userId={m.user_id}
                        name={name}
                        isSelf={isSelf}
                      />
                    </div>
                  ) : (
                    <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
      {admin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invites ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending invites. Use “Invite member” to create a link.
              </p>
            ) : (
              <ul className="divide-y">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[i.role]} ·{" "}
                        {i.expired
                          ? `expired ${formatDate(i.expires_at)}`
                          : `expires ${formatDate(i.expires_at)}`}
                      </p>
                    </div>
                    {i.expired ? <Badge variant="outline">Expired</Badge> : null}
                    <RevokeInviteButton orgSlug={orgSlug} inviteId={i.id} email={i.email} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
