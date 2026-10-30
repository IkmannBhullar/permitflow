import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

/** Automated WCAG 2.1 AA scan (axe-core) of every main page, in light and dark mode. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]

async function scan(page: Page, label: string) {
  await page.waitForLoadState("networkidle")
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return violations.map(
    (v) =>
      `[${label}] ${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 3)
        .map(
          (n) => `    ${n.target.join(" ")} :: ${n.failureSummary?.split("\n")[1]?.trim() ?? ""}`
        )
        .join("\n")
  )
}

for (const scheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    const problems: string[] = []
    const visit = async (label: string, path?: string) => {
      if (path) await page.goto(path)
      problems.push(...(await scan(page, label)))
    }

    await visit("landing", "/")
    await visit("login", "/login")
    await visit("signup", "/signup")
    await page.goto("/")
    await page.getByRole("button", { name: "Try the demo" }).click()
    await page.waitForURL(/dashboard$/)
    const base = "/app/cascade-ridge-demo"
    await visit("dashboard")
    await visit("projects", `${base}/projects`)
    await page.locator(`a[href^="${base}/projects/"]`).first().click()
    await visit("project")
    await visit("permits", `${base}/permits`)
    await page.goto(`${base}/permits?status=corrections_required`)
    await page.locator(`a[href^="${base}/permits/"]`).first().click()
    await visit("permit")
    await page.getByRole("button", { name: "Change status" }).click()
    await page
      .getByRole("dialog")
      .evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
    await visit("status dialog")
    await page.keyboard.press("Escape")
    await visit("tasks", `${base}/tasks?view=corrections`)
    await visit("documents", `${base}/documents`)
    await page.locator(`a[href^="${base}/documents/"]`).first().click()
    await visit("document")
    await visit("reports", `${base}/reports/pending`)
    await visit("team", `${base}/team`)
    await visit("settings", `${base}/settings`)
    await visit("notifications", `${base}/notifications`)
    await page.getByRole("button", { name: /Notifications/ }).click()
    // Let the popover's fade-in finish, or axe measures half-transparent text.
    await page
      .locator("[data-slot=popover-content]")
      .evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
    await visit("bell popover")

    expect(problems, problems.join("\n")).toEqual([])
  })
}

test("core flows work from the keyboard alone", async ({ page }) => {
  // Log in to the demo using only the keyboard.
  await page.goto("/login")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "PermitFlow home" })).toBeFocused()
  await page.getByLabel("Email").focus()
  await page.keyboard.type("pm@cascade-ridge.example")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Password")).toBeFocused()
  await page.keyboard.type(process.env.DEMO_USER_PASSWORD ?? "")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/dashboard$/)

  // First Tab reaches "Skip to content", which moves focus past the navigation.
  await page.keyboard.press("Tab")
  const skip = page.getByRole("link", { name: "Skip to content" })
  await expect(skip).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("#main-content")).toBeFocused()

  // Open a permit, open the status dialog with the keyboard, close it with Escape: focus returns.
  await page.goto("/app/cascade-ridge-demo/permits?status=corrections_required")
  await page.getByRole("link", { name: "Fire sprinkler modification" }).focus()
  await page.keyboard.press("Enter")
  const trigger = page.getByRole("button", { name: "Change status" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("dialog").getByLabel("New status")).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(trigger).toBeFocused()

  // Filters are operable with arrow keys.
  await page.goto("/app/cascade-ridge-demo/permits")
  await page.getByRole("combobox", { name: /Filter by status/ }).focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("option", { name: "All statuses" })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("option", { name: /^Pending/ })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/status=submitted%2Cunder_review/)
})
