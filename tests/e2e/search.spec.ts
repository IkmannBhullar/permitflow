import { expect, test } from "@playwright/test"

test("⌘K search finds permits and projects and jumps to them (demo data)", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Try the demo" }).click()
  await expect(page).toHaveURL(/dashboard$/)

  await page.keyboard.press("ControlOrMeta+k")
  const dialog = page.getByRole("dialog", { name: "Search" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("option", { name: "Permits" })).toBeVisible() // quick navigation before typing

  await dialog.getByRole("combobox").fill("sprinkler")
  await expect(dialog.getByRole("option", { name: /Fire sprinkler modification/ })).toBeVisible()
  await expect(
    dialog.getByRole("option", { name: /Fire sprinkler$|Fire sprinkler FIR/ })
  ).toBeVisible()

  await dialog.getByRole("combobox").fill("BLD-")
  await expect(dialog.getByText("Building – kitchen remodel")).toBeVisible()

  await dialog.getByRole("combobox").fill("Harbor")
  // Wait for this query's results (the previous list also mentions the project by name).
  const projects = dialog.getByRole("group", { name: "Projects" })
  await expect(projects.getByRole("option", { name: /^Harbor Street Café TI/ })).toBeVisible()
  await expect(dialog.getByRole("option").first()).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/)
  await expect(page.getByRole("heading", { name: /Harbor Street Café TI/ })).toBeVisible()

  await page.getByRole("button", { name: "Search projects and permits" }).click()
  await page.getByRole("dialog", { name: "Search" }).getByRole("combobox").fill("zzzz-nothing")
  await expect(page.getByText("No matching projects or permits.")).toBeVisible()
})
