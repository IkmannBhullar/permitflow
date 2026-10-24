import { createHash, randomBytes, randomUUID } from "node:crypto"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

export type Client = SupabaseClient<Database>
type Role = Database["public"]["Enums"]["org_role"]

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const options = { auth: { persistSession: false, autoRefreshToken: false } }

/** Service-role client for arranging fixtures. Tests assert with user clients. */
export const admin = (): Client =>
  createClient<Database>(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, options)

export const anon = (): Client => createClient<Database>(url(), anonKey(), options)

export const PASSWORD = "integration-test-pw-1"

export type TestUser = { id: string; email: string; client: Client }

const runId = randomBytes(3).toString("hex")

export async function createUser(label: string): Promise<TestUser> {
  const email = `${label}-${runId}-${randomBytes(2).toString("hex")}@test.permitflow.local`
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: label },
  })
  if (error) throw error
  return { id: data.user.id, email, client: await signIn(email) }
}

export async function signIn(email: string): Promise<Client> {
  const client = anon()
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw error
  return client
}

export async function createOrg(owner: TestUser, name = "Test Org") {
  const slug = `t-${runId}-${randomBytes(3).toString("hex")}`
  const { data, error } = await owner.client.rpc("create_organization", {
    p_name: name,
    p_slug: slug,
  })
  if (error) throw error
  return data
}

export async function addMember(orgId: string, user: TestUser, role: Role) {
  const { error } = await admin()
    .from("organization_members")
    .insert({ org_id: orgId, user_id: user.id, role })
  if (error) throw error
}

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export const newToken = () => randomBytes(32).toString("base64url")

export async function cleanup(orgIds: string[], users: TestUser[]) {
  const db = admin()
  if (orgIds.length) await db.from("organizations").delete().in("id", orgIds)
  for (const user of users) await db.auth.admin.deleteUser(user.id)
}

/** A one-page PDF small enough to inline. */
export const TINY_PDF = new Blob(
  [
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
  ],
  { type: "application/pdf" }
)

export const uuid = () => randomUUID()
