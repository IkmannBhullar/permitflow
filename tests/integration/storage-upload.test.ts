import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildTenants, type Tenants } from "./fixtures"
import { cleanup, TINY_PDF, uuid } from "./helpers"

let t: Tenants

beforeAll(async () => {
  t = await buildTenants()
})

afterAll(async () => {
  if (t) await cleanup([t.orgA.id, t.orgB.id], t.users)
})

const pathFor = (orgId: string, projectId: string) =>
  `${orgId}/${projectId}/${uuid()}/v1/upload.pdf`

describe("signed uploads", () => {
  it("lets an editor upload through a signed URL and read back the real size and type", async () => {
    const path = pathFor(t.orgA.id, t.project.id)
    const { data: signed, error } = await t.pmA.client.storage
      .from("documents")
      .createSignedUploadUrl(path)
    expect(error).toBeNull()
    const upload = await t.pmA.client.storage
      .from("documents")
      .uploadToSignedUrl(path, signed!.token, TINY_PDF, { contentType: "application/pdf" })
    expect(upload.error).toBeNull()

    const { data: info } = await t.viewerA.client.storage.from("documents").info(path)
    expect(info?.size).toBe(TINY_PDF.size)
    expect(info?.contentType).toBe("application/pdf")
  })

  it("refuses signed upload URLs to viewers and to other orgs", async () => {
    const viewer = await t.viewerA.client.storage
      .from("documents")
      .createSignedUploadUrl(pathFor(t.orgA.id, t.project.id))
    expect(viewer.error).not.toBeNull()
    const outsider = await t.adminB.client.storage
      .from("documents")
      .createSignedUploadUrl(pathFor(t.orgA.id, t.project.id))
    expect(outsider.error).not.toBeNull()
  })

  it("hides object metadata from other orgs", async () => {
    const { data } = await t.adminB.client.storage.from("documents").info(t.storagePath)
    expect(data).toBeNull()
  })
})
