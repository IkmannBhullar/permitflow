import { readFile } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { createOrg, signUp, uniqueEmail } from "./helpers"

test("reports render, export CSV and print without app chrome (demo data)", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Try the demo" }).click()
  await page.getByRole("link", { name: "Reports" }).click()

  await page.getByRole("link", { name: /Pending permits/ }).click()
  await expect(page.getByText(/7 pending permits\./)).toBeVisible()
  const rows = page.getByRole("table").getByRole("row")
  await expect(rows).toHaveCount(8) // header + 7

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("link", { name: "Export CSV" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(
    /^cascade-ridge-demo-pending-\d{4}-\d{2}-\d{2}\.csv$/
  )
  const csv = (await readFile((await download.path())!, "utf8")).replace(/^﻿/, "")
  const lines = csv.trim().split("\r\n")
  expect(lines[0]).toBe(
    "Permit,Project,Type,Status,Application #,Jurisdiction,Submitted,Days waiting,Assignee"
  )
  expect(lines).toHaveLength(8)

  await page.emulateMedia({ media: "print" })
  await expect(page.getByRole("button", { name: "Print / Save as PDF" })).toBeHidden()
  await expect(page.locator("[data-slot=sidebar-container]")).toBeHidden()
  await expect(
    page.getByText("PermitFlow tracks permits. It does not submit applications to")
  ).toBeVisible()
  await page.emulateMedia({ media: "screen" })

  await page.getByRole("link", { name: "← Reports" }).click()
  await page.getByRole("link", { name: /Expiring permits/ }).click()
  await page.getByRole("link", { name: "7 days" }).click()
  await expect(page.getByText(/permits? expiring in the next 7 days\./)).toBeVisible()
  await expect(page.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
    "href",
    /export\?days=7$/
  )

  await page.goto("/app/cascade-ridge-demo/reports/corrections")
  await expect(page.getByText("4 permits waiting on corrections.")).toBeVisible()
  await page.goto("/app/cascade-ridge-demo/reports/project-summary")
  await expect(page.getByText(/active projects, 29 permits\./)).toBeVisible()
})

test("a non-member can't export another org's report", async ({ page }) => {
  await signUp(page, { name: "Outsider Ops", email: uniqueEmail("report-outsider") })
  await createOrg(page, "Outsider Reports")
  const response = await page.request.get("/app/cascade-ridge-demo/reports/pending/export")
  expect(response.status()).toBe(404)
  expect(await response.text()).not.toContain("Permit,Project")
})
