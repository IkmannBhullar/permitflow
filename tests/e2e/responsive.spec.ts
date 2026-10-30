import { expect, test, type Page } from "@playwright/test"

/**
 * Layout check for the brief's breakpoints: no page may scroll sideways. Screenshots land in
 * test-results/responsive/ for visual review.
 */
const VIEWPORTS = [
  { name: "phone", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
]

async function firstHref(page: Page, prefix: string) {
  const href = await page.locator(`a[href^="${prefix}"]`).first().getAttribute("href")
  if (!href) throw new Error(`No link starting with ${prefix}`)
  return href
}

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize(vp)
    const shots: string[] = []
    const check = async (label: string, path?: string) => {
      if (path) await page.goto(path)
      await page.waitForLoadState("networkidle")
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
      expect(overflow, `${label} overflows by ${overflow}px at ${vp.width}px`).toBeLessThanOrEqual(
        0
      )
      // Tables hide low-priority columns instead of scrolling sideways (report tables may scroll).
      if (!label.startsWith("reports")) {
        const clipped = await page.evaluate(() =>
          [...document.querySelectorAll("[data-slot=table-container]")].some(
            (el) => el.scrollWidth > el.clientWidth + 1
          )
        )
        expect(clipped, `${label} has a table wider than its box at ${vp.width}px`).toBe(false)
      }
      await page.screenshot({
        path: `test-results/responsive/${vp.name}-${label}.png`,
        fullPage: true,
      })
      shots.push(label)
    }

    await check("landing", "/")
    await check("login", "/login")
    await page.goto("/")
    await page.getByRole("button", { name: "Try the demo" }).click()
    await page.waitForURL(/dashboard$/)
    const base = "/app/cascade-ridge-demo"
    await check("dashboard")
    await check("projects", `${base}/projects`)
    await check("project", await firstHref(page, `${base}/projects/`))
    await check("permits", `${base}/permits`)
    await page.goto(`${base}/permits?status=corrections_required`)
    await check("permit", await firstHref(page, `${base}/permits/`))
    await check("tasks", `${base}/tasks?view=corrections`)
    await check("documents", `${base}/documents`)
    await check("document", await firstHref(page, `${base}/documents/`))
    await check("reports", `${base}/reports/corrections`)
    await check("team", `${base}/team`)
    await check("settings", `${base}/settings`)
    await check("notifications", `${base}/notifications`)
    expect(shots).toHaveLength(14)
  })
}
