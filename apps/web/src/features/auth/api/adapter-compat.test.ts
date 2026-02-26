import { describe, expect, it, vi } from "vitest"
import type { AuthAdapter } from "./adapter"
import { BetterAuthAdapter } from "./better-auth-adapter"
import { getAuthAdapter, RestAuthAdapter } from "./rest-adapter"

describe("Auth adapter compatibility", () => {
  it("RestAuthAdapter and BetterAuthAdapter implement the same interface", () => {
    const rest: AuthAdapter = new RestAuthAdapter()
    const better: AuthAdapter = new BetterAuthAdapter()

    const methods: Array<keyof AuthAdapter> = [
      "signup",
      "login",
      "verifyEmail",
      "forgotPassword",
      "resetPassword",
      "me",
      "logout",
    ]

    methods.forEach((method) => {
      expect(typeof rest[method]).toBe("function")
      expect(typeof better[method]).toBe("function")
    })
  })

  it("uses adapter mode flag to select active adapter", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_ADAPTER", "rest")
    expect(getAuthAdapter()).toBeInstanceOf(RestAuthAdapter)

    vi.stubEnv("NEXT_PUBLIC_AUTH_ADAPTER", "better")
    expect(getAuthAdapter()).toBeInstanceOf(BetterAuthAdapter)

    vi.unstubAllEnvs()
  })
})
