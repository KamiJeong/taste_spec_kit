import { expect, test } from "@playwright/test"

const realApiBaseUrl = process.env.PLAYWRIGHT_REAL_API_BASE_URL

test.describe("@real-api Auth Real API Smoke", () => {
  test.skip(
    !realApiBaseUrl,
    "PLAYWRIGHT_REAL_API_BASE_URL is required. Example: http://localhost:3000",
  )

  test("forgot-password works against local backend API", async ({ page }) => {
    const uniqueEmail = `smoke-${Date.now()}@example.com`

    await page.goto("/forgot-password")
    await page.getByLabel("Email").fill(uniqueEmail)
    await page.getByRole("button", { name: "Send reset link" }).click()

    await expect(page.getByText("If your account exists, a reset link has been sent.")).toBeVisible()
  })

  test("login with unknown credentials returns mapped auth error", async ({ page }) => {
    const unknownEmail = `missing-${Date.now()}@example.com`

    await page.goto("/login")
    await page.getByLabel("Email").fill(unknownEmail)
    await page.getByLabel("Password").fill("WrongPass123!")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByText("Invalid credentials")).toBeVisible()
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible()
  })
})
