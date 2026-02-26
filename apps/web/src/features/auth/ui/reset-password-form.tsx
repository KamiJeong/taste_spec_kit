"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useResetPasswordMutation } from "../api/queries"
import { resetPasswordSchema, type ResetPasswordForm } from "../schemas"
import { AuthFeedback } from "./auth-feedback"
import { FieldError } from "./field-error"

type ResetPasswordFormProps = {
  token?: string
}

export function ResetPasswordFormView({ token }: ResetPasswordFormProps) {
  const [errorCode, setErrorCode] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const resetPasswordMutation = useResetPasswordMutation()
  const hasUrlToken = typeof token === "string" && token.length > 0
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { token: token ?? "", newPassword: "", confirmPassword: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorCode(undefined)
    setSuccessMessage(undefined)
    const result = await resetPasswordMutation.mutateAsync({
      token: values.token,
      newPassword: values.newPassword,
    })
    if (!result.success) {
      setErrorCode(result.code)
      return
    }
    setSuccessMessage("Password has been reset. You can sign in now.")
  })
  const tokenErrorId = form.formState.errors.token ? "reset-token-error" : undefined
  const newPasswordErrorId = form.formState.errors.newPassword
    ? "reset-new-password-error"
    : undefined
  const confirmPasswordErrorId = form.formState.errors.confirmPassword
    ? "reset-confirm-password-error"
    : undefined

  return (
    <Card className="border-border/70 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthFeedback
          errorCode={!hasUrlToken ? "AUTH_TOKEN_INVALID" : errorCode}
          fallbackMessage={
            !hasUrlToken
              ? "Missing token in URL. Open the reset link from your email again."
              : undefined
          }
          successMessage={successMessage}
        />
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input
              id="token"
              type="text"
              readOnly={hasUrlToken}
              aria-invalid={!!form.formState.errors.token}
              aria-describedby={tokenErrorId}
              {...form.register("token")}
            />
            <FieldError id={tokenErrorId} message={form.formState.errors.token?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              aria-invalid={!!form.formState.errors.newPassword}
              aria-describedby={newPasswordErrorId}
              {...form.register("newPassword")}
            />
            <FieldError id={newPasswordErrorId} message={form.formState.errors.newPassword?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              aria-invalid={!!form.formState.errors.confirmPassword}
              aria-describedby={confirmPasswordErrorId}
              {...form.register("confirmPassword")}
            />
            <FieldError
              id={confirmPasswordErrorId}
              message={form.formState.errors.confirmPassword?.message}
            />
          </div>
          <Button
            disabled={form.formState.isSubmitting || resetPasswordMutation.isPending || !hasUrlToken}
            type="submit"
            className="w-full"
          >
            {form.formState.isSubmitting || resetPasswordMutation.isPending
              ? "Updating..."
              : "Update password"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Back to{" "}
          <Link className="underline-offset-4 hover:underline" href="/login">
            login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
