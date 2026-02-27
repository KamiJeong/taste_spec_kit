import { expect, test } from "@playwright/test"

test.describe("Auth Session Invalidation", () => {
  test("updates session state after login and logout", async ({ page }) => {
    let signedIn = false
    const email = "session-user@example.com"

    await page.route("**/api/v1/auth/me", async (route) => {
      if (signedIn) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: "user-1",
                email,
                name: "Session User",
                emailVerified: true,
              },
            },
          }),
        })
        return
      }

      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          code: "AUTH_SESSION_REQUIRED",
          message: "Session required",
        }),
      })
    })

    await page.route("**/api/v1/auth/login", async (route) => {
      signedIn = true
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: "user-1",
              email,
              name: "Session User",
              emailVerified: true,
            },
          },
        }),
      })
    })

    await page.route("**/api/v1/auth/logout", async (route) => {
      signedIn = false
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {},
        }),
      })
    })

    await page.goto("/login")
    await page.getByRole("button", { name: "Dev Auth" }).click()
    await expect(page.getByText("Session: signed out")).toBeVisible()
    await page.getByRole("button", { name: "Close" }).click()

    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password").fill("StrongPass123!")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByText("Logged in. Session cookie should now be active.")).toBeVisible()
    await page.getByRole("button", { name: "Dev Auth" }).click()
    await expect(page.getByText(`Session: signed in (${email})`)).toBeVisible()

    await page.getByRole("button", { name: "Logout" }).click()
    await expect(page.getByText("Session: signed out")).toBeVisible()
  })
})
