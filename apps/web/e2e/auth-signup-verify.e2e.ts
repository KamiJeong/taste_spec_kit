import { expect, test } from "@playwright/test"

test.describe("Auth Signup and Verify", () => {
  test("submits signup and verifies email with token", async ({ page }) => {
    const verificationToken = "verify-token-e2e"

    await page.route("**/api/v1/auth/signup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { accountState: "PENDING_VERIFICATION", verificationToken },
        }),
      })
    })

    await page.goto("/signup")
    await page.getByLabel("Name").fill("E2E User")
    await page.getByLabel("Email").fill("e2e@example.com")
    await page.getByLabel("Password").fill("StrongPass123!")
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(page.getByText("Signup accepted. Check your email for verification link.")).toBeVisible()

    await page.route("**/api/v1/auth/verify-email?token=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { accountState: "ACTIVE" },
        }),
      })
    })

    await page.goto(`/verify-email?token=${verificationToken}`)
    await page.getByRole("button", { name: "Verify now" }).click()
    await expect(page.getByText("Email verified. You can now sign in.")).toBeVisible()
  })
})
