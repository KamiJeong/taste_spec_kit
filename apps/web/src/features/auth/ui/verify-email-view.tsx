"use client"

import Link from "next/link"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui"
import { useState } from "react"
import { useVerifyEmailMutation } from "../api/queries"
import { AuthFeedback } from "./auth-feedback"

type VerifyEmailViewProps = {
  token?: string
}

export function VerifyEmailView({ token }: VerifyEmailViewProps) {
  const [errorCode, setErrorCode] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const verifyEmailMutation = useVerifyEmailMutation()

  const verify = async () => {
    if (!token) {
      setErrorCode("AUTH_TOKEN_INVALID")
      return
    }
    setErrorCode(undefined)
    setSuccessMessage(undefined)
    const result = await verifyEmailMutation.mutateAsync(token)
    if (!result.success) {
      setErrorCode(result.code)
      return
    }
    setSuccessMessage("Email verified. You can now sign in.")
  }

  return (
    <Card className="border-border/70 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      <CardHeader>
        <CardTitle>Verify email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthFeedback errorCode={errorCode} successMessage={successMessage} />
        <Button className="w-full" onClick={verify} disabled={verifyEmailMutation.isPending}>
          {verifyEmailMutation.isPending ? "Verifying..." : "Verify now"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Continue to{" "}
          <Link className="underline-offset-4 hover:underline" href="/login">
            login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
