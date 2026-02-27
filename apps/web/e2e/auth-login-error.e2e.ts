import { expect, test } from "@playwright/test"

test.describe("Auth Login Errors", () => {
  test("maps backend invalid credentials error", async ({ page }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Invalid credentials",
        }),
      })
    })

    await page.goto("/login")
    await page.getByLabel("Email").fill("user@example.com")
    await page.getByLabel("Password").fill("WrongPassword123!")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByText("Invalid credentials")).toBeVisible()
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible()
  })
})
