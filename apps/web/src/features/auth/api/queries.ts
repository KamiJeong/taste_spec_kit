"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "./adapter"
import { getAuthAdapter } from "./rest-adapter"

export const authQueryKeys = {
  me: ["auth", "me"] as const,
}

export function useAuthMeQuery(enabled = true) {
  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: () => getAuthAdapter().me(),
    enabled,
  })
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: SignupInput) => getAuthAdapter().signup(input),
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => getAuthAdapter().login(input),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me })
      }
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => getAuthAdapter().forgotPassword(input),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => getAuthAdapter().resetPassword(input),
  })
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (token: string) => getAuthAdapter().verifyEmail(token),
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => getAuthAdapter().logout(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me })
    },
  })
}
