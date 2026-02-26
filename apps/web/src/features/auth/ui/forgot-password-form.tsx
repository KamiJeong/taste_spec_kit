"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useForgotPasswordMutation } from "../api/queries"
import { forgotPasswordSchema, type ForgotPasswordForm } from "../schemas"
import { AuthFeedback } from "./auth-feedback"
import { FieldError } from "./field-error"

export function ForgotPasswordFormView() {
  const [errorCode, setErrorCode] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const forgotPasswordMutation = useForgotPasswordMutation()
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorCode(undefined)
    setSuccessMessage(undefined)
    const result = await forgotPasswordMutation.mutateAsync(values)
    if (!result.success && result.code !== "AUTH_REQUEST_COOLDOWN") {
      setErrorCode(result.code)
      return
    }
    if (result.success && result.data.resetToken && typeof window !== "undefined") {
      localStorage.setItem("dev.auth.resetToken", result.data.resetToken)
    }
    setSuccessMessage("If your account exists, a reset link has been sent.")
  })
  const emailErrorId = form.formState.errors.email ? "forgot-email-error" : undefined

  return (
    <Card className="border-border/70 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthFeedback errorCode={errorCode} successMessage={successMessage} />
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={emailErrorId}
              {...form.register("email")}
            />
            <FieldError id={emailErrorId} message={form.formState.errors.email?.message} />
          </div>
          <Button
            disabled={form.formState.isSubmitting || forgotPasswordMutation.isPending}
            type="submit"
            className="w-full"
          >
            {form.formState.isSubmitting || forgotPasswordMutation.isPending
              ? "Requesting..."
              : "Send reset link"}
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
