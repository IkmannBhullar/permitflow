/**
 * Demo data seed: `pnpm db:seed` (create if missing) or `pnpm db:reset-demo` (wipe and rebuild).
 *
 * Uses the service-role key, so it bypasses RLS. Database triggers skip activity and
 * notifications when there is no signed-in user, so this script writes a realistic,
 * backdated history itself. Only the demo org (slug below) is ever touched.
 */
import { randomUUID } from "node:crypto"

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

import type { Database, TablesInsert } from "../src/lib/supabase/database.types"
import {
  COMMENTS,
  DEMO_ORG,
  DEMO_USERS,
  DOCUMENTS,
  PERMITS,
  PROJECTS,
  TASKS,
  type PermitFixture,
  type UserKey,
} from "./seed/fixtures"
import { placeholderPdf } from "./seed/pdf"

config({ path: ".env.local", quiet: true })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.DEMO_USER_PASSWORD
if (!url || !serviceKey || !password) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_USER_PASSWORD (see .env.example)."
  )
  process.exit(1)
}
if (process.env.DEMO_USER_EMAIL && process.env.DEMO_USER_EMAIL !== DEMO_USERS.pm.email) {
  console.warn(
    `Note: DEMO_USER_EMAIL is ${process.env.DEMO_USER_EMAIL}, but the seeded demo PM is ${DEMO_USERS.pm.email}.`
  )
}

const db = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const reset = process.argv.includes("--reset")

// ---------------------------------------------------------------------------------------------
// Time helpers: everything is relative to "now" so the demo never goes stale.

const now = new Date()
const dayMs = 86_400_000
const dateIn = (days: number) => new Date(now.getTime() + days * dayMs).toISOString().slice(0, 10)
/** A timestamp `days` ago during working hours, nudged by `minutes` to keep ordering stable. */
const at = (daysAgo: number, minutes = 0) => {
  const d = new Date(now.getTime() - daysAgo * dayMs)
  d.setUTCHours(16, 0, 0, 0)
  return new Date(Math.min(d.getTime() + minutes * 60_000, now.getTime() - 60_000)).toISOString()
}

function must<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string
): NonNullable<R["data"]> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`)
  return result.data as NonNullable<R["data"]>
}

// ---------------------------------------------------------------------------------------------

async function ensureUsers(): Promise<Record<UserKey, string>> {
  const existing = new Map<string, string>()
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) if (u.email) existing.set(u.email.toLowerCase(), u.id)
    if (data.users.length < 1000) break
  }

  const ids = {} as Record<UserKey, string>
  for (const [key, user] of Object.entries(DEMO_USERS) as [
    UserKey,
    (typeof DEMO_USERS)[UserKey],
  ][]) {
    const id = existing.get(user.email)
    if (id) {
      // Restores the password and name in case a demo visitor changed them.
      const { error } = await db.auth.admin.updateUserById(id, {
        password,
        user_metadata: { full_name: user.name },
      })
      if (error) throw error
      await db.from("profiles").update({ full_name: user.name }).eq("id", id)
      ids[key] = id
    } else {
      const { data, error } = await db.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: user.name },
      })
      if (error) throw error
      ids[key] = data.user.id
    }
  }
  return ids
}

async function deleteDemoOrg() {
  const { data: org } = await db
    .from("organizations")
    .select("id")
    .eq("slug", DEMO_ORG.slug)
    .maybeSingle()
  if (!org) return
  const { data: versions } = await db
    .from("document_versions")
    .select("storage_path")
    .eq("org_id", org.id)
  const paths = (versions ?? []).map((v) => v.storage_path)
  for (let i = 0; i < paths.length; i += 100) {
    await db.storage.from("documents").remove(paths.slice(i, i + 100))
  }
  must(await db.from("organizations").delete().eq("id", org.id), "delete demo org")
}

/** The statuses a permit passed through to reach its current one. */
function statusPath(status: PermitFixture["status"]): PermitFixture["status"][] {
  switch (status) {
    case "draft":
      return []
    case "submitted":
      return ["submitted"]
    case "under_review":
      return ["submitted", "under_review"]
    case "corrections_required":
      return ["submitted", "under_review", "corrections_required"]
    case "approved":
      return ["submitted", "under_review", "approved"]
    case "rejected":
      return ["submitted", "under_review", "rejected"]
    case "closed":
      return ["submitted", "under_review", "approved", "closed"]
    case "expired":
      return ["submitted", "under_review", "approved", "expired"]
  }
}

async function seed() {
  console.log(`Seeding demo data into ${url}`)
  const users = await ensureUsers()
  const { data: existingOrg } = await db
    .from("organizations")
    .select("id")
    .eq("slug", DEMO_ORG.slug)
    .maybeSingle()
  if (existingOrg && !reset) {
    console.log(
      "Demo org already exists; users and passwords refreshed. Run `pnpm db:reset-demo` to rebuild its data."
    )
    return
  }
  await deleteDemoOrg()

  const activity: TablesInsert<"activity_log">[] = []
  const log = (row: Omit<TablesInsert<"activity_log">, "org_id">) =>
    activity.push({ ...row, org_id: orgId })

  // Organization and members -----------------------------------------------------------------
  const org = must(
    await db
      .from("organizations")
      .insert({ ...DEMO_ORG, is_demo: true, created_by: users.admin, created_at: at(200) })
      .select("id")
      .single(),
    "create org"
  )
  const orgId = org.id
  must(
    await db.from("organization_members").insert(
      (Object.keys(DEMO_USERS) as UserKey[]).map((key, i) => ({
        org_id: orgId,
        user_id: users[key],
        role: DEMO_USERS[key].role,
        created_at: at(200 - i * 5),
      }))
    ),
    "add members"
  )
  for (const [i, key] of (Object.keys(DEMO_USERS) as UserKey[]).entries()) {
    log({
      entity_type: "member",
      entity_id: users[key],
      actor_id: users[key],
      action: "member_added",
      metadata: { role: DEMO_USERS[key].role },
      created_at: at(200 - i * 5),
    })
  }

  // Projects ---------------------------------------------------------------------------------
  const projectIds: Record<string, string> = {}
  for (const p of PROJECTS) {
    const created = at(p.startAgo + 10)
    const row = must(
      await db
        .from("projects")
        .insert({
          org_id: orgId,
          name: p.name,
          address: p.address,
          city: p.city,
          jurisdiction: p.jurisdiction,
          project_type: p.type,
          status: p.status,
          manager_id: users[p.manager],
          start_date: dateIn(-p.startAgo),
          target_completion_date: dateIn(p.targetIn),
          created_by: users.admin,
          created_at: created,
        })
        .select("id")
        .single(),
      `project ${p.name}`
    )
    projectIds[p.key] = row.id
    log({
      project_id: row.id,
      entity_type: "project",
      entity_id: row.id,
      actor_id: users.admin,
      action: "created",
      metadata: { name: p.name },
      created_at: created,
    })
    if (p.status !== "active") {
      log({
        project_id: row.id,
        entity_type: "project",
        entity_id: row.id,
        actor_id: users.admin,
        action: "status_changed",
        metadata: { name: p.name, from: "active", to: p.status },
        created_at: at(Math.max(1, Math.min(30, p.startAgo - 5))),
      })
    }
  }

  // Permits and their status history ------------------------------------------------------------
  const permitIds: Record<string, string> = {}
  const prefix: Record<string, string> = {
    building: "BLD",
    electrical: "ELE",
    plumbing: "PLM",
    mechanical: "MEC",
    demolition: "DEM",
    grading: "GRD",
    fire: "FIR",
    signage: "SGN",
    other: "GEN",
  }
  for (const [i, p] of PERMITS.entries()) {
    const project = PROJECTS.find((x) => x.key === p.project)!
    const actor = users[p.assignee ?? "admin"]
    const createdAgo = (p.submittedAgo ?? 3 + (i % 9)) + 5
    const steps = statusPath(p.status)
    const lastAgo = p.changedAgo ?? p.approvedAgo ?? p.submittedAgo ?? createdAgo

    // Time each status step: submitted at submittedAgo, approved at approvedAgo, final at lastAgo,
    // anything else spread evenly in between.
    const stepAgo = steps.map((s, idx) => {
      if (s === "submitted") return p.submittedAgo ?? createdAgo
      if (s === "approved" && p.approvedAgo !== undefined) return p.approvedAgo
      if (idx === steps.length - 1) return lastAgo
      const start = p.submittedAgo ?? createdAgo
      return Math.round(start - ((start - lastAgo) * idx) / Math.max(1, steps.length - 1))
    })

    const row = must(
      await db
        .from("permits")
        .insert({
          org_id: orgId,
          project_id: projectIds[p.project]!,
          name: p.name,
          permit_type: p.type,
          jurisdiction: project.jurisdiction,
          application_number:
            p.submittedAgo !== undefined
              ? `${prefix[p.type]}-${now.getUTCFullYear()}-${String(1040 + i * 37).padStart(4, "0")}`
              : null,
          status: p.status,
          submitted_at: p.submittedAgo !== undefined ? dateIn(-p.submittedAgo) : null,
          approved_at: p.approvedAgo !== undefined ? dateIn(-p.approvedAgo) : null,
          expires_at: p.expiresIn !== undefined ? dateIn(p.expiresIn) : null,
          assignee_id: p.assignee ? users[p.assignee] : null,
          notes: p.notes ?? "",
          created_by: actor,
          created_at: at(createdAgo),
        })
        .select("id")
        .single(),
      `permit ${p.name}`
    )
    permitIds[p.key] = row.id
    // The insert trigger stamps "now"; backdate it to the last status change.
    must(
      await db
        .from("permits")
        .update({ status_changed_at: at(steps.length ? lastAgo : createdAgo, 30) })
        .eq("id", row.id),
      "backdate status"
    )

    const projectId = projectIds[p.project]!
    log({
      project_id: projectId,
      entity_type: "permit",
      entity_id: row.id,
      actor_id: actor,
      action: "created",
      metadata: { name: p.name, status: "draft" },
      created_at: at(createdAgo),
    })
    let from: string = "draft"
    steps.forEach((to, idx) => {
      log({
        project_id: projectId,
        entity_type: "permit",
        entity_id: row.id,
        actor_id: actor,
        action: "status_changed",
        metadata: { name: p.name, from, to },
        created_at: at(stepAgo[idx]!, 30 + idx),
      })
      from = to
    })
  }

  // Tasks --------------------------------------------------------------------------------------
  for (const [i, t] of TASKS.entries()) {
    const actor = users[t.assignee ?? "admin"]
    const row = must(
      await db
        .from("tasks")
        .insert({
          org_id: orgId,
          project_id: projectIds[t.project]!,
          permit_id: t.permit ? permitIds[t.permit]! : null,
          title: t.title,
          description: t.description ?? "",
          assignee_id: t.assignee ? users[t.assignee] : null,
          due_date: t.dueIn !== undefined ? dateIn(t.dueIn) : null,
          priority: t.priority,
          status: t.status,
          is_correction: t.correction ?? false,
          completed_at: t.status === "done" ? at(t.completedAgo ?? 0, 90) : null,
          created_by: actor,
          created_at: at(t.createdAgo, 60 + i),
        })
        .select("id")
        .single(),
      `task ${t.title}`
    )
    const meta = { title: t.title, permit_id: t.permit ? permitIds[t.permit] : null }
    log({
      project_id: projectIds[t.project]!,
      entity_type: "task",
      entity_id: row.id,
      actor_id: actor,
      action: "created",
      metadata: { ...meta, is_correction: t.correction ?? false },
      created_at: at(t.createdAgo, 60 + i),
    })
    if (t.status === "done") {
      log({
        project_id: projectIds[t.project]!,
        entity_type: "task",
        entity_id: row.id,
        actor_id: actor,
        action: "completed",
        metadata: { ...meta, from: "todo", to: "done" },
        created_at: at(t.completedAgo ?? 0, 90),
      })
    }
  }

  // Documents with versions -------------------------------------------------------------------
  for (const d of DOCUMENTS) {
    const documentId = randomUUID()
    const projectId = projectIds[d.project]!
    const permitId = d.permit ? permitIds[d.permit]! : null
    must(
      await db.from("documents").insert({
        id: documentId,
        org_id: orgId,
        project_id: projectId,
        permit_id: permitId,
        name: d.name,
        uploaded_by: users[d.versions[0]!.by],
        created_at: at(d.versions[0]!.uploadedAgo),
      }),
      `document ${d.name}`
    )
    for (const [i, v] of d.versions.entries()) {
      const version = i + 1
      const bytes = await placeholderPdf(`${d.name} (v${version})`, v.lines)
      const path = `${orgId}/${projectId}/${documentId}/v${version}/${d.file}`
      const upload = await db.storage
        .from("documents")
        .upload(path, bytes, { contentType: "application/pdf", upsert: true })
      if (upload.error) throw new Error(`upload ${path}: ${upload.error.message}`)
      must(
        await db.from("document_versions").insert({
          document_id: documentId,
          org_id: orgId,
          version,
          storage_path: path,
          size_bytes: bytes.byteLength,
          mime_type: "application/pdf",
          uploaded_by: users[v.by],
          created_at: at(v.uploadedAgo, 120),
        }),
        `version ${path}`
      )
      log({
        project_id: projectId,
        entity_type: "document",
        entity_id: documentId,
        actor_id: users[v.by],
        action: "uploaded",
        metadata: { name: d.name, version, permit_id: permitId },
        created_at: at(v.uploadedAgo, 120),
      })
    }
  }

  // Comments ------------------------------------------------------------------------------------
  for (const [i, c] of COMMENTS.entries()) {
    const permitId = permitIds[c.permit]!
    const project = PERMITS.find((p) => p.key === c.permit)!.project
    const row = must(
      await db
        .from("comments")
        .insert({
          org_id: orgId,
          entity_type: "permit",
          entity_id: permitId,
          author_id: users[c.by],
          body: c.body,
          created_at: at(c.daysAgo, 200 + i),
        })
        .select("id")
        .single(),
      "comment"
    )
    log({
      project_id: projectIds[project]!,
      entity_type: "permit",
      entity_id: permitId,
      actor_id: users[c.by],
      action: "commented",
      metadata: {
        comment_id: row.id,
        excerpt: c.body.slice(0, 140),
        name: PERMITS.find((p) => p.key === c.permit)!.name,
      },
      created_at: at(c.daysAgo, 200 + i),
    })
  }

  // A few notifications for the demo project manager --------------------------------------------
  must(
    await db.from("notifications").insert([
      {
        org_id: orgId,
        user_id: users.pm,
        type: "permit_status_changed",
        title: "Fire sprinkler modification is now Corrections Required",
        body: "Status changed from Under Review.",
        link: `permits/${permitIds["harbor-fire"]}`,
        created_at: at(2, 35),
      },
      {
        org_id: orgId,
        user_id: users.pm,
        type: "task_assigned",
        title: "You were assigned a task",
        body: "Get revised hydraulic calcs from sprinkler sub",
        link: `permits/${permitIds["harbor-fire"]}`,
        created_at: at(2, 70),
      },
      {
        org_id: orgId,
        user_id: users.pm,
        type: "permit_assigned",
        title: "You were assigned a permit",
        body: "Food service plan review",
        link: `permits/${permitIds["harbor-health"]}`,
        created_at: at(3, 10),
        read_at: at(2),
      },
    ]),
    "notifications"
  )

  activity.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  for (let i = 0; i < activity.length; i += 200) {
    must(await db.from("activity_log").insert(activity.slice(i, i + 200)), "activity")
  }

  console.log(
    `Done: 1 org, ${Object.keys(users).length} users, ${PROJECTS.length} projects, ${PERMITS.length} permits, ` +
      `${TASKS.length} tasks, ${DOCUMENTS.length} documents, ${COMMENTS.length} comments, ${activity.length} activity entries.`
  )
  console.log(
    `Demo login: ${DEMO_USERS.pm.email} (project manager). Other users: ${[DEMO_USERS.admin, DEMO_USERS.pm2, DEMO_USERS.viewer].map((u) => u.email).join(", ")}.`
  )
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
