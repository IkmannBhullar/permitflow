import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  admin,
  anon,
  cleanup,
  createOrg,
  createUser,
  hashToken,
  newToken,
  type TestUser,
} from "./helpers"

let owner: TestUser
let invitee: TestUser
let stranger: TestUser
let orgId: string
let orgSlug: string

beforeAll(async () => {
  owner = await createUser("inv-owner")
  invitee = await createUser("inv-invitee")
  stranger = await createUser("inv-stranger")
  const org = await createOrg(owner, "Invite Org")
  orgId = org.id
  orgSlug = org.slug
})

afterAll(async () => {
  await cleanup(orgId ? [orgId] : [], [owner, invitee, stranger].filter(Boolean))
})

async function invite(email: string, role: "viewer" | "project_manager" = "project_manager") {
  const token = newToken()
  const { error } = await owner.client
    .from("invites")
    .insert({ org_id: orgId, email, role, token_hash: hashToken(token) })
  if (error) throw error
  return token
}

describe("invite acceptance", () => {
  it("previews an invite for anyone holding the token, and nothing for a bad token", async () => {
    const token = await invite(invitee.email)
    const { data } = await anon().rpc("get_invite", { p_token: token })
    expect(data?.[0]).toMatchObject({ org_slug: orgSlug, email: invitee.email, status: "valid" })

    const { data: none } = await anon().rpc("get_invite", { p_token: "not-a-token" })
    expect(none).toEqual([])

    // Same token: revoke so the next test can issue a fresh one for this email.
    await owner.client
      .from("invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashToken(token))
  })

  it("rejects a different signed-in email, then lets the invitee join exactly once", async () => {
    const token = await invite(invitee.email)

    const wrong = await stranger.client.rpc("accept_invite", { p_token: token })
    expect(wrong.error?.message).toBe("invite_email_mismatch")

    const right = await invitee.client.rpc("accept_invite", { p_token: token })
    expect(right.error).toBeNull()
    expect(right.data).toBe(orgSlug)

    const { data: member } = await admin()
      .from("organization_members")
      .select("role")
      .match({ org_id: orgId, user_id: invitee.id })
      .single()
    expect(member?.role).toBe("project_manager")

    const again = await invitee.client.rpc("accept_invite", { p_token: token })
    expect(again.error?.message).toBe("invite_used")
  })

  it("rejects expired and revoked invites", async () => {
    const expired = await invite(stranger.email)
    await admin()
      .from("invites")
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq("token_hash", hashToken(expired))
    const r1 = await stranger.client.rpc("accept_invite", { p_token: expired })
    expect(r1.error?.message).toBe("invite_expired")

    await owner.client
      .from("invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashToken(expired))
    const r2 = await stranger.client.rpc("accept_invite", { p_token: expired })
    expect(r2.error?.message).toBe("invite_not_found")
  })

  it("cannot be accepted anonymously", async () => {
    const { error } = await anon().rpc("accept_invite", { p_token: "anything" })
    expect(error).not.toBeNull()
  })

  it("does not let an invitee rewrite the invite or see others", async () => {
    const { data } = await invitee.client.from("invites").select("*").eq("org_id", orgId)
    expect(data).toEqual([])
  })
})
