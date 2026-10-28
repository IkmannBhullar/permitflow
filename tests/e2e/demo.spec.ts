import { expect, test } from "@playwright/test"

/** Requires the demo org: `pnpm db:seed` (CI and local setup run it before e2e). */
test("Try the demo signs in as the demo PM and shows a populated dashboard", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Try the demo" }).click()
  await expect(page).toHaveURL(/\/app\/cascade-ridge-demo\/dashboard$/)

  await expect(
    page.getByText("Demo data. All names, addresses and permits are fictional.")
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Current organization: Cascade Ridge Builders \(Demo\)/ })
  ).toBeVisible()

  const numbers = page.getByRole("region", { name: "Key numbers" })
  await expect(numbers.getByRole("link", { name: /Total permits\s*29/ })).toBeVisible()
  await expect(numbers.getByRole("link", { name: /Corrections required\s*4/ })).toBeVisible()
  await expect(numbers.getByText(/Overdue tasks\s*[1-9]/)).toBeVisible()
  await expect(page.getByText(/in review for \d+ days/).first()).toBeVisible()

  await page.screenshot({ path: "test-results/demo-dashboard.png", fullPage: true })
  await page.getByRole("link", { name: "Permits", exact: true }).click()
  await expect(page.getByText("Showing 1–20 of 29")).toBeVisible()
  await page.screenshot({ path: "test-results/demo-permits.png", fullPage: true })
})

test("tasks views: my tasks, overdue from the dashboard, and corrections tracking", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Try the demo" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page
    .getByRole("region", { name: "Key numbers" })
    .getByRole("link", { name: /Overdue tasks/ })
    .click()
  await expect(page).toHaveURL(/\/tasks\?view=overdue$/)
  const tasks = page.getByRole("list", { name: "Tasks" })
  await expect(tasks.getByText(/Overdue/).first()).toBeVisible()
  await expect(tasks.getByText(/^Due /)).toHaveCount(0)

  await page.getByRole("link", { name: "My tasks" }).click()
  await expect(tasks.getByText("Get revised hydraulic calcs from sprinkler sub")).toBeVisible()
  await expect(tasks.getByText("Book rough electrical inspection")).toHaveCount(0) // assigned to Taylor

  await page.getByRole("link", { name: "Corrections" }).click()
  await expect(
    page.getByRole("heading", { name: "Permits waiting on corrections (4)" })
  ).toBeVisible()
  await expect(page.getByText("No open correction tasks")).toHaveCount(0)
  await expect(tasks.getByText("Correction").first()).toBeVisible()
})
