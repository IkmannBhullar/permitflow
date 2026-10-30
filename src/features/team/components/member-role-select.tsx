"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ORG_ROLES, ROLE_LABELS, type OrgRole } from "@/features/orgs/roles"

import { changeMemberRole } from "../actions"

export function MemberRoleSelect({
  orgSlug,
  userId,
  name,
  role,
}: {
  orgSlug: string
  userId: string
  name: string
  role: OrgRole
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Select
      value={role}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(async () => {
          const result = await changeMemberRole(orgSlug, { userId, role: next as OrgRole })
          if (result.ok)
            toast.success(`${name} is now ${ROLE_LABELS[next as OrgRole].toLowerCase()}`)
          else toast.error(result.error)
        })
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={`Role for ${name}: ${ROLE_LABELS[role]}`}
        className="w-40"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORG_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
