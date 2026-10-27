import "server-only"

import { createHash, randomBytes } from "node:crypto"

/** 256-bit random invite token. Only its SHA-256 is stored; the raw token is shown once. */
export function newInviteToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashInviteToken(token) }
}

/** Must match public.hash_invite_token() in the database. */
export function hashInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}
