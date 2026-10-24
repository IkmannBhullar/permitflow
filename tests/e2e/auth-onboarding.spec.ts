import { expect, test } from "@playwright/test"

import { createOrg, E2E_PASSWORD, signUp, uniqueEmail } from "./helpers"

test("signup → create org → empty dashboard, then log out and back in", async ({ page }) => {
  const email = uniqueEmail("onboard")
  await signUp(page, { name: "Riley Foreman", email })

  const slug = await createOrg(page, "Riley Construction")
  expect(slug).toMatch(/^riley-construction/)
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  await expect(page.getByText("Nothing to report yet")).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Current organization: Riley Construction/ })
  ).toBeVisible()
  await expect(
    page.getByText("does not submit to or verify with government agencies")
  ).toBeVisible()

  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
  await expect(page).toHaveURL(/\/login$/)

  // Protected routes bounce to login and come back afterwards.
  await page.goto(`/app/${slug}/dashboard`)
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(E2E_PASSWORD)
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL(new RegExp(`/app/${slug}/dashboard$`))
})

test("shows inline validation and safe auth errors", async ({ page }) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Enter a valid email address.")).toBeVisible()

  await page.getByLabel("Email").fill("nobody@e2e.permitflow.local")
  await page.getByLabel("Password").fill("wrong-password")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Incorrect email or password.")).toBeVisible()
})

test("non-members get a 404 for another org's URL", async ({ page }) => {
  await signUp(page, { name: "Outsider", email: uniqueEmail("outsider") })
  await createOrg(page, "Outsider Co")
  await page.goto("/app/definitely-not-my-org/dashboard")
  await expect(page.getByText("We couldn't find that page")).toBeVisible()
})
