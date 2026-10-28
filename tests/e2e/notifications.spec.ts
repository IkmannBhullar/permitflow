import { expect, test } from "@playwright/test"

import { chooseOption, createOrg, createProject, signUp, uniqueEmail } from "./helpers"

test("cron route requires the secret", async ({ request }) => {
  expect((await request.get("/api/cron/due-notifications")).status()).toBe(401)
  expect(
    (
      await request.get("/api/cron/due-notifications", {
        headers: { authorization: "Bearer wrong-secret-value" },
      })
    ).status()
  ).toBe(401)
  const ok = await request.get(
    "/api/cron/due-notifications?org=00000000-0000-0000-0000-000000000000",
    {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }
  )
  expect(ok.status()).toBe(200)
  expect(await ok.json()).toMatchObject({ ok: true, created: 0 })
})

test("admin runs the due-date check: one reminder, bell count, mark read, idempotent", async ({
  page,
}) => {
  await signUp(page, { name: "Quinn Admin", email: uniqueEmail("notify") })
  const slug = await createOrg(page, "Notify Co")
  await createProject(page, slug, "Spruce Way Garage")
  await page.getByRole("button", { name: "Add permit" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Permit name").fill("Electrical permit")
  await chooseOption(page, "Current status", "Approved")
  await chooseOption(page, "Assignee", "Quinn Admin")
  const soon = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
  await dialog.getByLabel("Expires").fill(soon)
  await dialog.getByRole("button", { name: "Add permit" }).click()
  await expect(page.getByRole("heading", { name: /Electrical permit/ })).toBeVisible()

  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible()
  await page.goto(`/app/${slug}/notifications`)
  await page.getByRole("button", { name: "Check due dates now" }).click()
  await expect(page.getByText("Sent 1 new reminder.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Notifications, 1 unread" })).toBeVisible()

  await page.getByRole("button", { name: "Check due dates now" }).click()
  await expect(page.getByText("No new reminders.")).toBeVisible()

  await page.getByRole("button", { name: "Notifications, 1 unread" }).click()
  await page.getByRole("button", { name: /Electrical permit expires in 5 days/ }).click()
  await expect(page).toHaveURL(/\/permits\//)
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible()
})

test("assignees are notified of status changes made by someone else (demo data)", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Try the demo" }).click()
  const bell = page.getByRole("button", { name: /Notifications, \d+ unread/ })
  await expect(bell).toBeVisible()
  await bell.click()
  await expect(
    page.getByRole("button", { name: /Fire sprinkler modification is now Corrections Required/ })
  ).toBeVisible()
  await page.getByRole("button", { name: "Mark all read" }).click()
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible()
})
