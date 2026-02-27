import type { ApiResult } from "./client"

export type AuthUser = {
  id: string
  email: string
  name?: string
  emailVerified?: boolean
  createdAt?: string
}

export type SignupInput = {
  email: string
  password: string
  name?: string
}

export type LoginInput = {
  email: string
  password: string
}

export type ForgotPasswordInput = {
  email: string
}

export type ResetPasswordInput = {
  token: string
  newPassword: string
}

export interface AuthAdapter {
  signup(input: SignupInput): Promise<ApiResult<{ accountState?: string; verificationToken?: string }>>
  login(input: LoginInput): Promise<ApiResult<{ user?: AuthUser }>>
  verifyEmail(token: string): Promise<ApiResult<{ accountState?: string }>>
  forgotPassword(input: ForgotPasswordInput): Promise<ApiResult<{ resetToken?: string }>>
  resetPassword(input: ResetPasswordInput): Promise<ApiResult<Record<string, never>>>
  me(): Promise<ApiResult<{ user?: AuthUser }>>
  logout(): Promise<ApiResult<Record<string, never>>>
}
