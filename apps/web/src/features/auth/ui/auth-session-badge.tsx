"use client"

import Link from "next/link"
import { Button } from "@repo/ui"
import { useAuthMeQuery, useLogoutMutation } from "../api/queries"

export function AuthSessionBadge() {
  const meQuery = useAuthMeQuery(true)
  const logoutMutation = useLogoutMutation()

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
  }

  if (meQuery.isLoading) {
    return (
      <div className="rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
        Session: checking...
      </div>
    )
  }

  if (!meQuery.data?.success) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs">
        <span className="text-muted-foreground">Session: signed out</span>
        <Link href="/login" className="underline-offset-4 hover:underline">
          Login
        </Link>
      </div>
    )
  }

  const email = meQuery.data.data.user?.email ?? "unknown"
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs">
      <span className="max-w-[180px] truncate text-muted-foreground">Signed in: {email}</span>
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? "..." : "Logout"}
      </Button>
    </div>
  )
}
