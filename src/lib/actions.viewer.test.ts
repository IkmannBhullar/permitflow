import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Calls every mutating Server Action as a viewer (and admin-only ones as a project manager).
 * The fake Supabase client answers only the membership lookup; touching any other table
 * fails the test, proving the role gate runs before any data access. RLS integration tests
 * separately prove the database refuses these writes too.
 */

const touched: string[] = []
let role = "viewer"

function chain(result: unknown) {
  const builder: Record<string, unknown> = {}
  const self = new Proxy(builder, {
    get: (_target, prop) => (prop === "maybeSingle" ? async () => result : () => self),
  })
  return self
}

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }))
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ getAll: () => [] }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: "user-1" } } }) },
    from: (table: string) => {
      if (table === "organization_members") {
        return chain({
          data: {
            role,
            organizations: { id: "org-1", slug: "acme", name: "Acme", is_demo: false },
          },
          error: null,
        })
      }
      touched.push(table)
      throw new Error(`unexpected access to ${table}`)
    },
    rpc: (fn: string) => {
      touched.push(`rpc:${fn}`)
      throw new Error(`unexpected rpc ${fn}`)
    },
    storage: {
      from: () => {
        touched.push("storage")
        throw new Error("unexpected storage access")
      },
    },
  }),
}))

const modules = {
  comments: () => import("@/features/comments/actions"),
  documents: () => import("@/features/documents/actions"),
  notifications: () => import("@/features/notifications/actions"),
  orgs: () => import("@/features/orgs/actions"),
  permits: () => import("@/features/permits/actions"),
  projects: () => import("@/features/projects/actions"),
  search: () => import("@/features/search/actions"),
  tasks: () => import("@/features/tasks/actions"),
  team: () => import("@/features/team/actions"),
}

/** Org-scoped actions every member may call (reads and their own notification state). */
const OPEN_TO_VIEWERS = new Set([
  "getDocumentUrl",
  "markNotificationRead",
  "markAllNotificationsRead",
  "searchOrg",
])
/** Not org-scoped: they check the session themselves. */
const NOT_ORG_SCOPED = new Set(["createOrganization"])
const ADMIN_ONLY = new Set([
  "deleteTask",
  "deletePermit",
  "setProjectArchived",
  "updateOrganization",
  "deleteDocument",
  "createInvite",
  "revokeInvite",
  "changeMemberRole",
  "removeMember",
  "runDueNotificationsNow",
])

async function allActions() {
  const entries: [
    string,
    (slug: string, input: unknown) => Promise<{ ok: boolean; error?: string }>,
  ][] = []
  for (const load of Object.values(modules)) {
    for (const [name, fn] of Object.entries(await load())) {
      if (typeof fn === "function" && !NOT_ORG_SCOPED.has(name)) entries.push([name, fn as never])
    }
  }
  return entries
}

beforeEach(() => {
  touched.length = 0
})

describe("role gates on every Server Action", () => {
  it("covers every exported action in the list above", async () => {
    const names = (await allActions()).map(([n]) => n)
    expect(names.length).toBeGreaterThanOrEqual(25)
    for (const n of ADMIN_ONLY) expect(names).toContain(n)
  })

  it("a viewer is refused by every mutating action before any data access", async () => {
    role = "viewer"
    for (const [name, action] of await allActions()) {
      if (OPEN_TO_VIEWERS.has(name)) continue
      const result = await action("acme", {})
      expect(result.ok, name).toBe(false)
      expect(result.error, name).toMatch(/read-only|Only admins/)
    }
    expect(touched).toEqual([])
  })

  it("a project manager is refused by every admin-only action", async () => {
    role = "project_manager"
    for (const [name, action] of await allActions()) {
      if (!ADMIN_ONLY.has(name)) continue
      const result = await action("acme", {})
      expect(result, name).toEqual({ ok: false, error: "Only admins can do that." })
    }
    expect(touched).toEqual([])
  })
})
