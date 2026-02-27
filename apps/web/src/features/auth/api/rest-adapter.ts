import { authRequest } from "./client"
import { BetterAuthAdapter } from "./better-auth-adapter"
import type {
  AuthAdapter,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "./adapter"

export class RestAuthAdapter implements AuthAdapter {
  signup(input: SignupInput) {
    return authRequest<{ accountState?: string; verificationToken?: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  login(input: LoginInput) {
    return authRequest<{ user?: { id: string; email: string; name?: string; emailVerified?: boolean } }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    )
  }

  verifyEmail(token: string) {
    return authRequest<{ accountState?: string }>(
      `/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
    )
  }

  forgotPassword(input: ForgotPasswordInput) {
    return authRequest<{ resetToken?: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  resetPassword(input: ResetPasswordInput) {
    return authRequest<Record<string, never>>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  me() {
    return authRequest<{ user?: { id: string; email: string; name?: string; emailVerified?: boolean; createdAt?: string } }>(
      "/api/v1/auth/me",
    )
  }

  logout() {
    return authRequest<Record<string, never>>("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    })
  }
}

const restAdapter = new RestAuthAdapter()
const betterAdapter = new BetterAuthAdapter()

export function getAuthAdapter(): AuthAdapter {
  const mode = (process.env.NEXT_PUBLIC_AUTH_ADAPTER ?? "rest").toLowerCase()
  if (mode === "better") {
    return betterAdapter
  }
  return restAdapter
}
