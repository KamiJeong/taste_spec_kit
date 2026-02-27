import { expect, test } from "@playwright/test"

test.describe("Auth Login", () => {
  test("shows required field validation on empty submit", async ({ page }) => {
    await page.goto("/login")

    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByText("Email is required")).toBeVisible()
    await expect(page.getByText("Password is required")).toBeVisible()
  })
})
