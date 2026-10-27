import { expect, test } from "@playwright/test"

import { createOrg, signUp, uniqueEmail } from "./helpers"

test("create, edit, archive and restore a project", async ({ page }) => {
  await signUp(page, { name: "Pat Admin", email: uniqueEmail("projects") })
  const slug = await createOrg(page, "Projects Co")

  await page.getByRole("link", { name: "Projects" }).click()
  await expect(page.getByText("No projects yet")).toBeVisible()
  await page.getByRole("button", { name: "New project" }).first().click()

  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Project name").fill("Maple Street Duplex")
  await dialog.getByLabel("Address").fill("412 Maple St")
  await dialog.getByLabel("City").fill("Riverton")
  await dialog.getByLabel("Project manager").click()
  await page.getByRole("option", { name: "Pat Admin" }).click()
  await dialog.getByLabel("Start date").fill("2026-11-01")
  await dialog.getByLabel("Target completion").fill("2026-10-01")
  await dialog.getByRole("button", { name: "Create project" }).click()
  await expect(dialog.getByText("Target completion can't be before the start date.")).toBeVisible()

  await dialog.getByLabel("Target completion").fill("2027-06-30")
  await dialog.getByRole("button", { name: "Create project" }).click()
  await expect(page).toHaveURL(new RegExp(`/app/${slug}/projects/[0-9a-f-]{36}$`))
  await expect(page.getByRole("heading", { name: /Maple Street Duplex/ })).toBeVisible()
  await expect(page.getByText("412 Maple St, Riverton")).toBeVisible()
  await expect(page.getByText("Pat Admin created project Maple Street Duplex")).toBeVisible()

  await page.getByRole("button", { name: "Edit" }).click()
  await page.getByRole("dialog").getByLabel("Jurisdiction").fill("Riverton County")
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Project updated")).toBeVisible()
  await expect(page.getByText("Riverton County")).toBeVisible()
  await expect(
    page.getByText(/updated the jurisdiction of project Maple Street Duplex/)
  ).toBeVisible()

  await page.getByRole("button", { name: "Archive" }).click()
  await page.getByRole("button", { name: "Archive project" }).click()
  await expect(page.getByText("Project archived")).toBeVisible()
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0)

  await page.goto(`/app/${slug}/projects`)
  await expect(page.getByText("No projects yet")).toBeVisible()
  await page.getByRole("link", { name: "Archived" }).click()
  await page.getByRole("link", { name: "Maple Street Duplex" }).click()
  await page.getByRole("button", { name: "Restore" }).click()
  await page.getByRole("button", { name: "Restore project" }).click()
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible()
})
