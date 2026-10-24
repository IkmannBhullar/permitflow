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

export async function createOrg(page: Page, name: string) {
  await page.getByLabel("Company name").fill(name)
  await page.getByRole("button", { name: "Create organization" }).click()
  await expect(page).toHaveURL(/\/app\/[a-z0-9-]+\/dashboard$/)
  return new URL(page.url()).pathname.split("/")[2]!
}
