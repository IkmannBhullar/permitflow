import { expect, test } from "@playwright/test"

import {
  chooseOption,
  createOrg,
  createProject,
  E2E_PASSWORD,
  signUp,
  uniqueEmail,
} from "./helpers"

/**
 * The brief's golden path. Steps that depend on Day 3 features (PDF upload, CSV export)
 * are added to this test when those features land.
 */
test("golden path: register → org → project → permit → assign → corrections → task → dashboard", async ({
  page,
  browser,
  baseURL,
}) => {
  // Register and create the organization.
  await signUp(page, { name: "Morgan Lead", email: uniqueEmail("golden") })
  const slug = await createOrg(page, "Golden Path Builders")
  await expect(page.getByText("Nothing to report yet")).toBeVisible()

  // Bring in a teammate to assign work to.
  await page.getByRole("link", { name: "Team" }).click()
  await page.getByRole("button", { name: "Invite member" }).click()
  const teammateEmail = uniqueEmail("golden-teammate")
  await page.getByRole("dialog").getByLabel("Email").fill(teammateEmail)
  await page.getByRole("dialog").getByRole("button", { name: "Create invite link" }).click()
  const link = await page.getByRole("dialog").getByLabel("Invite link").inputValue()
  await page.getByRole("dialog").getByRole("button", { name: "Done" }).click()
  const teammate = await (await browser.newContext({ baseURL })).newPage()
  await teammate.goto(
    `/signup?next=${encodeURIComponent(new URL(link).pathname)}&email=${encodeURIComponent(teammateEmail)}`
  )
  await teammate.getByLabel("Full name").fill("Riley Super")
  await teammate.getByLabel("Password").fill(E2E_PASSWORD)
  await teammate.getByRole("button", { name: "Create account" }).click()
  await teammate.getByRole("button", { name: /Join Golden Path Builders/ }).click()
  await expect(teammate).toHaveURL(new RegExp(`/app/${slug}/dashboard$`))

  // Create a project and add a permit assigned to the teammate.
  await createProject(page, slug, "Juniper Street Fourplex")
  await page.getByRole("button", { name: "Add permit" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Permit name").fill("Building permit – fourplex")
  await chooseOption(page, "Current status", "Under review")
  await chooseOption(page, "Assignee", "Riley Super")
  await dialog.getByLabel("Application #").fill("BLD-2026-7781")
  await dialog.getByRole("button", { name: "Add permit" }).click()
  await expect(page.getByRole("heading", { name: /Building permit – fourplex/ })).toBeVisible()
  await expect(page.locator("dd", { hasText: "Riley Super" })).toBeVisible()

  // Dashboard before corrections.
  await page.getByRole("link", { name: "Dashboard" }).click()
  const numbers = page.getByRole("region", { name: "Key numbers" })
  await expect(numbers.getByRole("link", { name: /Pending\s*1/ })).toBeVisible()
  await expect(numbers.getByRole("link", { name: /Corrections required\s*0/ })).toBeVisible()
  await expect(numbers.getByText(/Overdue tasks\s*0/)).toBeVisible()

  // The reviewer asks for corrections.
  await page.getByRole("link", { name: "Permits", exact: true }).click()
  await page.getByRole("link", { name: "Building permit – fourplex" }).click()
  await page.getByRole("button", { name: "Change status" }).click()
  await chooseOption(page, "New status", "Corrections required")
  await page.getByRole("dialog").getByRole("button", { name: "Update status" }).click()
  await expect(page.getByText("Status changed to Corrections required")).toBeVisible()

  // Create a correction task that's already overdue.
  await page.getByRole("button", { name: "Add correction task" }).click()
  await page.getByRole("dialog").getByLabel("Title").fill("Revise stair riser heights on A-301")
  await chooseOption(page, "Assignee", "Riley Super")
  await page.getByRole("dialog").getByLabel("Due date").fill("2020-06-01")
  await page.getByRole("dialog").getByRole("button", { name: "Add task" }).click()
  await expect(page.getByText("Task added")).toBeVisible()

  // Dashboard numbers update.
  await page.getByRole("link", { name: "Dashboard" }).click()
  await expect(numbers.getByRole("link", { name: /Pending\s*0/ })).toBeVisible()
  await expect(numbers.getByRole("link", { name: /Corrections required\s*1/ })).toBeVisible()
  await expect(numbers.getByText(/Overdue tasks\s*1/)).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Revise stair riser heights on A-301.*overdue/ })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Building permit – fourplex.*corrections required/ })
  ).toBeVisible()

  // The teammate sees the same numbers in their own session.
  await teammate.reload()
  await expect(
    teammate
      .getByRole("region", { name: "Key numbers" })
      .getByRole("link", { name: /Corrections required\s*1/ })
  ).toBeVisible()
})
