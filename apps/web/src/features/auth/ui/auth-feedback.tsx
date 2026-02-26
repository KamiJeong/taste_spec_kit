"use client"

import { Alert, AlertDescription, AlertTitle } from "@repo/ui"
import { getAuthErrorMeta } from "../api/error-map"

type AuthFeedbackProps = {
  errorCode?: string
  fallbackMessage?: string
  successMessage?: string
}

export function AuthFeedback({ errorCode, fallbackMessage, successMessage }: AuthFeedbackProps) {
  if (successMessage) {
    return (
      <Alert className="border-emerald-500/40 bg-emerald-50 text-emerald-950">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    )
  }

  if (!errorCode && !fallbackMessage) {
    return null
  }

  const meta = getAuthErrorMeta(errorCode)
  return (
    <Alert variant="destructive">
      <AlertTitle>{meta.title}</AlertTitle>
      <AlertDescription>{fallbackMessage ?? meta.description}</AlertDescription>
    </Alert>
  )
}
