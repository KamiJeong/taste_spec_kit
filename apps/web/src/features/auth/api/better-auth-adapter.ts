import type {
  AuthAdapter,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "./adapter"
import type { ApiResult } from "./client"

function notReady(): ApiResult<never> {
  return {
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "BetterAuthAdapter is not wired yet.",
  }
}

export class BetterAuthAdapter implements AuthAdapter {
  signup(_input: SignupInput) {
    return Promise.resolve(notReady())
  }

  login(_input: LoginInput) {
    return Promise.resolve(notReady())
  }

  verifyEmail(_token: string) {
    return Promise.resolve(notReady())
  }

  forgotPassword(_input: ForgotPasswordInput) {
    return Promise.resolve(notReady())
  }

  resetPassword(_input: ResetPasswordInput) {
    return Promise.resolve(notReady())
  }

  me() {
    return Promise.resolve(notReady())
  }

  logout() {
    return Promise.resolve(notReady())
  }
}
