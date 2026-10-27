import { randomBytes } from "node:crypto"

import { expect, type Page } from "@playwright/test"

export function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${randomBytes(2).toString("hex")}@e2e.permitflow.local`
}

export const E2E_PASSWORD = "e2e-password-123"

export async function signUp(page: Page, { name, email }: { name: string; email: string }) {
  await page.goto("/signup")
  await page.getByLabel("Full name").fill(name)
  await page.getByLabel("Work email").fill(email)
  await page.getByLabel("Password").fill(E2E_PASSWORD)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page).toHaveURL(/\/onboarding$/)
}

/** Org names get a random suffix so re-runs never collide on the slug. */
export async function createOrg(page: Page, name: string) {
  await page.getByLabel("Company name").fill(`${name} ${randomBytes(2).toString("hex")}`)
  await page.getByRole("button", { name: "Create organization" }).click()
  await expect(page).toHaveURL(/\/app\/[a-z0-9-]+\/dashboard$/)
  return new URL(page.url()).pathname.split("/")[2]!
}

export async function createProject(page: Page, slug: string, name: string) {
  await page.goto(`/app/${slug}/projects`)
  await page.getByRole("button", { name: "New project" }).first().click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Project name").fill(name)
  await dialog.getByRole("button", { name: "Create project" }).click()
  await expect(page.getByRole("heading", { name: new RegExp(name) })).toBeVisible()
  return page.url().split("/").at(-1)!
}

export async function chooseOption(
  page: Page,
  label: string | RegExp,
  option: string,
  scope = page.getByRole("dialog")
) {
  await scope.getByLabel(label).click()
  await page.getByRole("option", { name: option, exact: true }).click()
}
