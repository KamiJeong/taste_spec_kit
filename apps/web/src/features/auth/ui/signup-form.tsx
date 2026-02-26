"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useSignupMutation } from "../api/queries"
import { signupSchema, type SignupForm } from "../schemas"
import { AuthFeedback } from "./auth-feedback"
import { FieldError } from "./field-error"

export function SignupFormView() {
  const [errorCode, setErrorCode] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const signupMutation = useSignupMutation()
  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "", name: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorCode(undefined)
    setSuccessMessage(undefined)
    const result = await signupMutation.mutateAsync(values)
    if (!result.success) {
      setErrorCode(result.code)
      return
    }
    if (result.data.verificationToken && typeof window !== "undefined") {
      localStorage.setItem("dev.auth.verificationToken", result.data.verificationToken)
    }
    setSuccessMessage("Signup accepted. Check your email for verification link.")
  })
  const nameErrorId = form.formState.errors.name ? "signup-name-error" : undefined
  const emailErrorId = form.formState.errors.email ? "signup-email-error" : undefined
  const passwordErrorId = form.formState.errors.password ? "signup-password-error" : undefined

  return (
    <Card className="border-border/70 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthFeedback errorCode={errorCode} successMessage={successMessage} />
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={nameErrorId}
              {...form.register("name")}
            />
            <FieldError id={nameErrorId} message={form.formState.errors.name?.message} />
          </div>
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
            disabled={form.formState.isSubmitting || signupMutation.isPending}
            type="submit"
            className="w-full"
          >
            {form.formState.isSubmitting || signupMutation.isPending ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Already have account?{" "}
          <Link className="underline-offset-4 hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
