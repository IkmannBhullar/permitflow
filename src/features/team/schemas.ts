import { z } from "zod"

import { emailSchema } from "@/features/auth/schemas"
import { ORG_ROLES } from "@/features/orgs/roles"

export const inviteSchema = z.object({ email: emailSchema, role: z.enum(ORG_ROLES) })
export type InviteInput = z.input<typeof inviteSchema>

export const changeRoleSchema = z.object({ userId: z.uuid(), role: z.enum(ORG_ROLES) })
export const removeMemberSchema = z.object({ userId: z.uuid() })
export const revokeInviteSchema = z.object({ id: z.uuid() })
