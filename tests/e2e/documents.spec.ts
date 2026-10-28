import { expect, test } from "@playwright/test"

import { createOrg, createProject, pdfFile, signUp, uniqueEmail } from "./helpers"

test("upload a PDF to a permit, preview, add a version, download and delete", async ({ page }) => {
  await signUp(page, { name: "Lee Docs", email: uniqueEmail("docs") })
  const slug = await createOrg(page, "Docs Co")
  await createProject(page, slug, "Willow Creek Clinic")
  await page.getByRole("button", { name: "Add permit" }).click()
  await page.getByRole("dialog").getByLabel("Permit name").fill("Building permit")
  await page.getByRole("dialog").getByRole("button", { name: "Add permit" }).click()
  await expect(page.getByRole("heading", { name: /Building permit/ })).toBeVisible()

  // Disallowed types are refused before anything is uploaded.
  await page.getByRole("button", { name: "Upload document" }).click()
  const dialog = page.getByRole("dialog")
  await dialog
    .getByLabel("File")
    .setInputFiles({ name: "run.sh", mimeType: "application/x-sh", buffer: Buffer.from("echo hi") })
  await expect(dialog.getByText(/isn't supported/)).toBeVisible()

  await dialog.getByLabel("File").setInputFiles(pdfFile("site_plan-rev-a.pdf"))
  await expect(dialog.getByLabel("Document name")).toHaveValue("site plan rev a")
  await dialog.getByLabel("Document name").fill("Site plan")
  await dialog.getByRole("button", { name: "Upload" }).click()
  await expect(page.getByText("Document uploaded")).toBeVisible()
  await expect(page.getByText("Lee Docs uploaded Site plan")).toBeVisible()

  await page.getByRole("link", { name: "Site plan" }).click()
  await expect(page.getByRole("heading", { name: /Site plan/ })).toBeVisible()
  const preview = page.locator('object[type="application/pdf"]')
  await expect(preview).toHaveAttribute("data", /\/storage\/v1\/object\/sign\/documents\/.+token=/)

  await page.getByRole("button", { name: "Upload new version" }).click()
  await page.getByRole("dialog").getByLabel("File").setInputFiles(pdfFile("site-plan-rev-b.pdf"))
  await page.getByRole("dialog").getByRole("button", { name: "Upload" }).click()
  await expect(page.getByText("Version 2 uploaded")).toBeVisible()
  await expect(page.getByRole("link", { name: /Version 2 \(latest\)/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /Version 1/ })).toBeVisible()

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download v2" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("site-plan-rev-b.pdf")

  await page.getByRole("link", { name: /Version 1/ }).click()
  await expect(page.getByRole("heading", { name: "Preview: version 1" })).toBeVisible()

  await page.getByRole("button", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete document" }).click()
  await expect(page).toHaveURL(/\/projects\//)
  await expect(page.getByText("No documents yet")).toBeVisible()
})
