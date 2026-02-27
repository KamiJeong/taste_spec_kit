"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useLoginMutation } from "../api/queries"
import { loginSchema, type LoginForm } from "../schemas"
import { AuthFeedback } from "./auth-feedback"
import { FieldError } from "./field-error"

export function LoginFormView() {
  const [errorCode, setErrorCode] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const loginMutation = useLoginMutation()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorCode(undefined)
    setSuccessMessage(undefined)
    const result = await loginMutation.mutateAsync(values)
    if (!result.success) {
      setErrorCode(result.code)
      return
    }
    setSuccessMessage("Logged in. Session cookie should now be active.")
  })
  const emailErrorId = form.formState.errors.email ? "login-email-error" : undefined
  const passwordErrorId = form.formState.errors.password ? "login-password-error" : undefined

  return (
    <Card className="border-border/70 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={passwordErrorId}
              {...form.register("password")}
            />
            <FieldError id={passwordErrorId} message={form.formState.errors.password?.message} />
          </div>
          <Button
            disabled={form.formState.isSubmitting || loginMutation.isPending}
            type="submit"
            className="w-full"
          >
            {form.formState.isSubmitting || loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          No account?{" "}
          <Link className="underline-offset-4 hover:underline" href="/signup">
            Create one
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          Forgot password?{" "}
          <Link className="underline-offset-4 hover:underline" href="/forgot-password">
            Reset here
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
