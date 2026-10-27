import { expect, test } from "@playwright/test"

import { chooseOption, createOrg, createProject, signUp, uniqueEmail } from "./helpers"

test("correction tasks on a permit, overdue flag, completion and delete", async ({ page }) => {
  await signUp(page, { name: "Sam Ortiz", email: uniqueEmail("tasks") })
  const slug = await createOrg(page, "Tasks Co")
  await createProject(page, slug, "Cedar Lane ADU")

  await page.getByRole("button", { name: "Add permit" }).click()
  await page.getByRole("dialog").getByLabel("Permit name").fill("Building permit")
  await chooseOption(page, "Current status", "Corrections required")
  await page.getByRole("dialog").getByRole("button", { name: "Add permit" }).click()
  await expect(page.getByText("The reviewer asked for corrections.")).toBeVisible()

  await page.getByRole("button", { name: "Add correction task" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Correction requested by the reviewer")).toBeChecked()
  await dialog.getByLabel("Title").fill("Revise egress window detail")
  await chooseOption(page, "Assignee", "Sam Ortiz")
  await chooseOption(page, "Priority", "Urgent")
  await dialog.getByLabel("Due date").fill("2020-01-15")
  await dialog.getByRole("button", { name: "Add task" }).click()

  const row = page.getByRole("listitem").filter({ hasText: "Revise egress window detail" })
  await expect(row.getByText("Correction")).toBeVisible()
  await expect(row.getByText("Urgent")).toBeVisible()
  await expect(row.getByText(/Overdue/)).toBeVisible()

  await row.getByRole("checkbox", { name: /Complete task/ }).click()
  await expect(row.getByRole("checkbox", { name: /Reopen task/ })).toBeChecked()
  await expect(row.getByText(/Overdue/)).toHaveCount(0)

  // The project page shows the task with its permit and the completion in activity.
  await page.getByRole("link", { name: "← Cedar Lane ADU" }).click()
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Revise egress window detail" })
      .getByRole("link", { name: "Building permit" })
  ).toBeVisible()
  await expect(page.getByText("Sam Ortiz completed task Revise egress window detail")).toBeVisible()

  // A correction task can't exist without a permit.
  await page.getByRole("button", { name: "Add task" }).first().click()
  const plain = page.getByRole("dialog")
  await plain.getByLabel("Title").fill("Order dumpster")
  await chooseOption(page, "Linked permit", "No permit")
  await plain.getByLabel("Correction requested by the reviewer").check()
  await plain.getByRole("button", { name: "Add task" }).click()
  await expect(plain.getByText("Correction tasks must be linked")).toBeVisible()
  await plain.getByLabel("Correction requested by the reviewer").uncheck()
  await plain.getByRole("button", { name: "Add task" }).click()
  await expect(page.getByText("Task added")).toBeVisible()

  // Admin delete through the row menu.
  await page.getByRole("button", { name: "Actions for task: Order dumpster" }).click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete task" }).click()
  await expect(page.getByText("Task deleted")).toBeVisible()
})
