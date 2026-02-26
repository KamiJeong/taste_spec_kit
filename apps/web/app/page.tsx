"use client"

import Link from "next/link"
import { Button } from "@repo/ui"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card/90 p-8 shadow-xl backdrop-blur">
        <p className="text-sm text-muted-foreground">taste_spec_kit</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold">
          Email Auth Frontend
        </h1>
        <p className="mt-3 text-muted-foreground">
          Next.js + Design System auth flow is ready to iterate.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
