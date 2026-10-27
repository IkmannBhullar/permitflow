"use client"

import { UserMinusIcon, XIcon } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"

import { removeMember, revokeInvite } from "../actions"

export function RemoveMemberButton({
  orgSlug,
  userId,
  name,
  isSelf,
}: {
  orgSlug: string
  userId: string
  name: string
  isSelf: boolean
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={isSelf ? "Leave organization" : `Remove ${name}`}
        >
          <UserMinusIcon />
        </Button>
      }
      title={isSelf ? "Leave this organization?" : `Remove ${name}?`}
      description={
        isSelf
          ? "You'll lose access immediately. Another admin would have to invite you back."
          : "They lose access immediately. Permits and tasks assigned to them become unassigned."
      }
      confirmLabel={isSelf ? "Leave" : "Remove member"}
      successMessage={isSelf ? "You left the organization" : `${name} was removed`}
      onConfirm={() => removeMember(orgSlug, { userId })}
    />
  )
}

export function RevokeInviteButton({
  orgSlug,
  inviteId,
  email,
}: {
  orgSlug: string
  inviteId: string
  email: string
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Revoke invite for ${email}`}>
          <XIcon />
        </Button>
      }
      title="Revoke this invite?"
      description={`The link sent to ${email} will stop working.`}
      confirmLabel="Revoke invite"
      successMessage="Invite revoked"
      onConfirm={() => revokeInvite(orgSlug, { id: inviteId })}
    />
  )
}
