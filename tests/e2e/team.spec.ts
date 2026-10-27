import { expect, test } from "@playwright/test"

import {
  chooseOption,
  createOrg,
  createProject,
  E2E_PASSWORD,
  signUp,
  uniqueEmail,
} from "./helpers"

test("invite by link, join, change roles, viewer is read-only, remove member", async ({
  page,
  browser,
  baseURL,
}) => {
  await signUp(page, { name: "Avery Admin", email: uniqueEmail("team-admin") })
  const slug = await createOrg(page, "Team Co")
  const projectId = await createProject(page, slug, "Oak Street Retail TI")

  await page.getByRole("link", { name: "Team" }).click()
  await page.getByRole("button", { name: "Invite member" }).click()
  const inviteeEmail = uniqueEmail("team-invitee")
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Email").fill(inviteeEmail)
  await dialog.getByRole("button", { name: "Create invite link" }).click()
  const link = await dialog.getByLabel("Invite link").inputValue()
  expect(link).toMatch(/\/invite\/[A-Za-z0-9_-]{43}$/)
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect(page.getByText(inviteeEmail)).toBeVisible()

  // The invitee opens the link in their own browser session.
  const invitee = await (await browser.newContext({ baseURL })).newPage()
  await invitee.goto(new URL(link).pathname)
  await expect(invitee.getByRole("heading", { name: /Join Team Co/ })).toBeVisible()
  await invitee.getByRole("link", { name: "Create account" }).click()
  await expect(invitee.getByLabel("Work email")).toHaveValue(inviteeEmail)
  await invitee.getByLabel("Full name").fill("Casey Invitee")
  await invitee.getByLabel("Password").fill(E2E_PASSWORD)
  await invitee.getByRole("button", { name: "Create account" }).click()
  await invitee.getByRole("button", { name: /Join Team Co/ }).click()
  await expect(invitee).toHaveURL(new RegExp(`/app/${slug}/dashboard$`))

  // As a project manager: can edit content, cannot manage the team.
  await invitee.goto(`/app/${slug}/team`)
  await expect(invitee.getByRole("button", { name: "Invite member" })).toHaveCount(0)
  await expect(invitee.getByText("Project manager").first()).toBeVisible()
  await invitee.goto(`/app/${slug}/projects/${projectId}`)
  await expect(invitee.getByRole("button", { name: "Edit" })).toBeVisible()

  // Admin demotes them to viewer.
  await page.reload()
  await chooseOption(page, "Role for Casey Invitee", "Viewer", page)
  await expect(page.getByText("Casey Invitee is now viewer")).toBeVisible()

  await invitee.reload()
  await expect(invitee.getByRole("heading", { name: /Oak Street Retail TI/ })).toBeVisible()
  await expect(invitee.getByRole("button", { name: "Edit" })).toHaveCount(0)
  await expect(invitee.getByRole("button", { name: "Add permit" })).toHaveCount(0)
  await expect(invitee.getByRole("button", { name: "Add task" })).toHaveCount(0)
  await invitee.goto(`/app/${slug}/settings`)
  await expect(invitee.getByText("Only admins can change these settings.")).toBeVisible()

  // The last admin can't demote themselves.
  await chooseOption(page, "Role for Avery Admin", "Viewer", page)
  await expect(page.getByText("An organization must keep at least one admin.")).toBeVisible()

  await page.getByRole("button", { name: "Remove Casey Invitee" }).click()
  await page.getByRole("button", { name: "Remove member" }).click()
  await expect(page.getByText("Casey Invitee was removed")).toBeVisible()
  await invitee.goto(`/app/${slug}/dashboard`)
  await expect(invitee.getByText("We couldn't find that page")).toBeVisible()
})

test("admin renames the organization and its URL", async ({ page }) => {
  await signUp(page, { name: "Robin Owner", email: uniqueEmail("settings") })
  const slug = await createOrg(page, "Rename Me")
  await page.getByRole("link", { name: "Settings" }).click()
  await page.getByLabel("Organization name").fill("Renamed Builders")
  await page.getByLabel("URL").fill(`${slug}-renamed`)
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page).toHaveURL(new RegExp(`/app/${slug}-renamed/settings$`))
  await expect(
    page.getByRole("button", { name: /Current organization: Renamed Builders/ })
  ).toBeVisible()
})
