"use client"

import { useEffect, useState } from "react"
import { Button, Input, Label } from "@repo/ui"
import { useAuthMeQuery, useLogoutMutation } from "../api/queries"

function readToken(key: string): string {
  if (typeof window === "undefined") {
    return ""
  }
  return localStorage.getItem(key) ?? ""
}

export function DevAuthTools() {
  const [open, setOpen] = useState(false)
  const [verificationToken, setVerificationToken] = useState("")
  const [resetToken, setResetToken] = useState("")
  const meQuery = useAuthMeQuery(true)
  const logoutMutation = useLogoutMutation()

  useEffect(() => {
    setVerificationToken(readToken("dev.auth.verificationToken"))
    setResetToken(readToken("dev.auth.resetToken"))
  }, [])

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[360px] rounded-xl border border-border bg-[hsl(var(--card))] p-4 text-[hsl(var(--card-foreground))] shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Dev Auth Tools</h3>
            <Button size="xs" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <div className="mb-4 rounded-md bg-muted p-2 text-xs text-muted-foreground">
            Local only. Requires `MAIL_TRANSPORT=log` and `MAIL_EXPOSE_TOKENS=true`.
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Session:{" "}
              {meQuery.data?.success
                ? `signed in (${meQuery.data.data.user?.email ?? "unknown"})`
                : "signed out"}
            </p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>

          <div className="mb-4 space-y-2">
            <Label htmlFor="dev-verify-token">Verification token</Label>
            <Input
              id="dev-verify-token"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="xs"
                onClick={() => {
                  if (!verificationToken) return
                  localStorage.setItem("dev.auth.verificationToken", verificationToken)
                  window.location.href = `/verify-email?token=${encodeURIComponent(verificationToken)}`
                }}
              >
                Open verify page
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(verificationToken)}
                disabled={!verificationToken}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dev-reset-token">Reset token</Label>
            <Input
              id="dev-reset-token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="xs"
                onClick={() => {
                  if (!resetToken) return
                  localStorage.setItem("dev.auth.resetToken", resetToken)
                  window.location.href = `/reset-password?token=${encodeURIComponent(resetToken)}`
                }}
              >
                Open reset page
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(resetToken)}
                disabled={!resetToken}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          Dev Auth
        </Button>
      )}
    </div>
  )
}
