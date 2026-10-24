import { addMember, createOrg, createUser, TINY_PDF, uuid, type TestUser } from "./helpers"

/**
 * Two tenants. Org A has one user per role plus a project, permit, task, comment and an
 * uploaded document, all created through user clients so RLS and triggers run for real.
 * Org B has a single admin who must never see or touch any of A.
 */
export async function buildTenants() {
  const adminA = await createUser("admin-a")
  const pmA = await createUser("pm-a")
  const viewerA = await createUser("viewer-a")
  const adminB = await createUser("admin-b")

  const orgA = await createOrg(adminA, "Org A")
  const orgB = await createOrg(adminB, "Org B")
  await addMember(orgA.id, pmA, "project_manager")
  await addMember(orgA.id, viewerA, "viewer")

  const project = await must(
    pmA.client
      .from("projects")
      .insert({ org_id: orgA.id, name: "A Tower", manager_id: pmA.id })
      .select()
      .single()
  )
  const permit = await must(
    pmA.client
      .from("permits")
      .insert({
        org_id: orgA.id,
        project_id: project.id,
        name: "A Building permit",
        assignee_id: pmA.id,
      })
      .select()
      .single()
  )
  const task = await must(
    pmA.client
      .from("tasks")
      .insert({ org_id: orgA.id, project_id: project.id, permit_id: permit.id, title: "A task" })
      .select()
      .single()
  )
  await must(
    pmA.client
      .from("comments")
      .insert({ org_id: orgA.id, entity_type: "permit", entity_id: permit.id, body: "A comment" })
      .select()
      .single()
  )

  const documentId = uuid()
  const storagePath = `${orgA.id}/${project.id}/${documentId}/v1/plans.pdf`
  const upload = await pmA.client.storage.from("documents").upload(storagePath, TINY_PDF, {
    contentType: "application/pdf",
  })
  if (upload.error) throw upload.error
  const document = await must(
    pmA.client
      .from("documents")
      .insert({
        id: documentId,
        org_id: orgA.id,
        project_id: project.id,
        permit_id: permit.id,
        name: "Plans",
      })
      .select()
      .single()
  )
  await must(
    pmA.client
      .from("document_versions")
      .insert({
        document_id: documentId,
        org_id: orgA.id,
        version: 1,
        storage_path: storagePath,
        size_bytes: TINY_PDF.size,
        mime_type: "application/pdf",
      })
      .select()
      .single()
  )

  const projectB = await must(
    adminB.client.from("projects").insert({ org_id: orgB.id, name: "B Plaza" }).select().single()
  )

  const users: TestUser[] = [adminA, pmA, viewerA, adminB]
  return {
    adminA,
    pmA,
    viewerA,
    adminB,
    orgA,
    orgB,
    project,
    permit,
    task,
    document,
    storagePath,
    projectB,
    users,
  }
}

export type Tenants = Awaited<ReturnType<typeof buildTenants>>

export async function must<R extends { data: unknown; error: unknown }>(
  query: PromiseLike<R>
): Promise<NonNullable<R["data"]>> {
  const { data, error } = await query
  if (error) throw error
  if (data === null || data === undefined) throw new Error("Expected a row")
  return data as NonNullable<R["data"]>
}
