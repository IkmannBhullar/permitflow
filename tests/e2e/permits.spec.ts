import { expect, test } from "@playwright/test"

import { chooseOption, createOrg, createProject, signUp, uniqueEmail } from "./helpers"

test("add a permit, approve it with a date, comment, filter and delete", async ({ page }) => {
  await signUp(page, { name: "Jordan Lee", email: uniqueEmail("permits") })
  const slug = await createOrg(page, "Permits Co")
  await createProject(page, slug, "Harbor View Remodel")

  await page.getByRole("button", { name: "Add permit" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Permit name").fill("Electrical rough-in")
  await chooseOption(page, "Type", "Electrical")
  await dialog.getByLabel("Application #").fill("ELEC-2026-0042")
  await chooseOption(page, "Assignee", "Jordan Lee")
  await dialog.getByLabel("Expires").fill("2027-03-01")
  await dialog.getByRole("button", { name: "Add permit" }).click()

  await expect(page.getByRole("heading", { name: /Electrical rough-in/ })).toBeVisible()
  await expect(page.getByText("ELEC-2026-0042")).toBeVisible()
  await expect(page.getByText("Jordan Lee added permit Electrical rough-in")).toBeVisible()

  // Approving requires a date; the dialog pre-fills today and refuses an empty one.
  await page.getByRole("button", { name: "Change status" }).click()
  const statusDialog = page.getByRole("dialog")
  await chooseOption(page, "New status", "Approved", statusDialog)
  await expect(statusDialog.getByLabel("Approval date")).not.toHaveValue("")
  await statusDialog.getByLabel("Approval date").fill("")
  await statusDialog.getByRole("button", { name: "Update status" }).click()
  await expect(statusDialog.getByText(/can't be approved without one/)).toBeVisible()
  await statusDialog.getByLabel("Approval date").fill("2026-10-20")
  await statusDialog.getByRole("button", { name: "Update status" }).click()
  await expect(page.getByText("Status changed to Approved")).toBeVisible()
  await expect(page.getByText("Oct 20, 2026")).toBeVisible()
  await expect(
    page.getByText("changed permit Electrical rough-in from Draft to Approved")
  ).toBeVisible()

  await page.getByLabel("Add a comment").fill("Inspector signed off on the panel.")
  await page.getByRole("button", { name: "Comment" }).click()
  await expect(page.getByText("Inspector signed off on the panel.")).toBeVisible()

  // A second permit to exercise the table filters.
  await page.getByRole("link", { name: "← Harbor View Remodel" }).click()
  await page.getByRole("button", { name: "Add permit" }).first().click()
  await page.getByRole("dialog").getByLabel("Permit name").fill("Plumbing rough-in")
  await chooseOption(page, "Current status", "Submitted")
  await page.getByRole("dialog").getByRole("button", { name: "Add permit" }).click()
  await expect(page.getByRole("heading", { name: /Plumbing rough-in/ })).toBeVisible()

  await page.getByRole("link", { name: "Permits", exact: true }).click()
  await expect(page.getByText("Showing 1–2 of 2")).toBeVisible()
  await page.getByLabel("Filter by status").click()
  await page.getByRole("option", { name: "Pending (submitted + under review)" }).click()
  await expect(page).toHaveURL(/status=submitted%2Cunder_review/)
  await expect(page.getByRole("link", { name: "Plumbing rough-in" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Electrical rough-in" })).toHaveCount(0)

  await page.getByRole("button", { name: "Clear filters" }).click()
  await page.getByLabel("Search permits").fill("ELEC-2026")
  await expect(page).toHaveURL(/q=ELEC-2026/)
  await expect(page.getByText("Showing 1–1 of 1")).toBeVisible()
  await page.getByLabel("Search permits").fill("")

  await page.getByRole("button", { name: "Permit", exact: true }).click()
  await expect(page).toHaveURL(/sort=name/)

  // Admin delete with confirmation.
  await page.getByRole("link", { name: "Plumbing rough-in" }).click()
  await page.getByRole("button", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete permit" }).click()
  await expect(page).toHaveURL(/\/projects\//)
  await expect(page.getByText("Jordan Lee deleted permit Plumbing rough-in")).toBeVisible()
})
