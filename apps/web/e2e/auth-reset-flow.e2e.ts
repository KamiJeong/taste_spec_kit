import { expect, test } from "@playwright/test"

test.describe("Auth Reset Flow", () => {
  test("requests reset and updates password with token", async ({ page }) => {
    await page.route("**/api/v1/auth/forgot-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { resetToken: "reset-token-e2e" },
        }),
      })
    })

    await page.goto("/forgot-password")
    await page.getByLabel("Email").fill("e2e@example.com")
    await page.getByRole("button", { name: "Send reset link" }).click()
    await expect(page.getByText("If your account exists, a reset link has been sent.")).toBeVisible()

    await page.route("**/api/v1/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {},
        }),
      })
    })

    await page.goto("/reset-password?token=reset-token-e2e")
    await page.getByLabel("New password").fill("NewPass123!")
    await page.getByLabel("Confirm password").fill("NewPass123!")
    await page.getByRole("button", { name: "Update password" }).click()
    await expect(page.getByText("Password has been reset. You can sign in now.")).toBeVisible()
  })
})
