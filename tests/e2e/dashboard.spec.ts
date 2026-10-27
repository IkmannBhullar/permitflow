import { expect, test } from "@playwright/test"

import { chooseOption, createOrg, createProject, signUp, uniqueEmail } from "./helpers"

test("dashboard numbers, attention list and deep links come from real data", async ({ page }) => {
  await signUp(page, { name: "Dana Dash", email: uniqueEmail("dash") })
  const slug = await createOrg(page, "Dash Co")
  await createProject(page, slug, "Birch Court Townhomes")

  await page.getByRole("button", { name: "Add permit" }).click()
  await page.getByRole("dialog").getByLabel("Permit name").fill("Grading permit")
  await chooseOption(page, "Current status", "Corrections required")
  await page.getByRole("dialog").getByRole("button", { name: "Add permit" }).click()
  await page.getByRole("button", { name: "Add correction task" }).click()
  await page.getByRole("dialog").getByLabel("Title").fill("Update erosion control plan")
  await page.getByRole("dialog").getByLabel("Due date").fill("2020-02-01")
  await page.getByRole("dialog").getByRole("button", { name: "Add task" }).click()
  await expect(page.getByText("Task added")).toBeVisible()

  await page.getByRole("link", { name: "Dashboard" }).click()
  const numbers = page.getByRole("region", { name: "Key numbers" })
  await expect(numbers.getByRole("link", { name: /Active projects\s*1/ })).toBeVisible()
  await expect(numbers.getByRole("link", { name: /Total permits\s*1/ })).toBeVisible()
  await expect(numbers.getByRole("link", { name: /Corrections required\s*1/ })).toBeVisible()
  await expect(numbers.getByText(/Overdue tasks\s*1/)).toBeVisible()
  await expect(
    page.getByRole("img", { name: /Permits by status\..*Corrections required: 1/ })
  ).toBeVisible()

  await expect(
    page.getByRole("link", { name: /Update erosion control plan.*days overdue/ })
  ).toBeVisible()
  await numbers.getByRole("link", { name: /Corrections required/ }).click()
  await expect(page).toHaveURL(/permits\?status=corrections_required/)
  await expect(page.getByRole("link", { name: "Grading permit" })).toBeVisible()
})
