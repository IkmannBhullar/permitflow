import { expect, test } from "@playwright/test"

test("pages send baseline security headers and no framework banner", async ({ request }) => {
  for (const path of ["/", "/login", "/app"]) {
    const response = await request.get(path, { maxRedirects: 0 })
    const headers = response.headers()
    expect(headers["x-frame-options"], path).toBe("DENY")
    expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'")
    expect(headers["x-content-type-options"], path).toBe("nosniff")
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin")
    expect(headers["x-powered-by"], path).toBeUndefined()
  }
})

test("protected pages and exports redirect signed-out visitors", async ({ request }) => {
  for (const path of [
    "/app",
    "/app/cascade-ridge-demo/dashboard",
    "/app/cascade-ridge-demo/reports/pending/export",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(307)
    expect(response.headers().location, path).toMatch(/^\/login\?next=/)
  }
})

test("open redirects through ?next are ignored", async ({ page }) => {
  await page.goto("/login?next=https://evil.example/phish")
  await page.getByLabel("Email").fill("pm@cascade-ridge.example")
  await page.getByLabel("Password").fill(process.env.DEMO_USER_PASSWORD ?? "")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL(/localhost:\d+\/app\//)
})
