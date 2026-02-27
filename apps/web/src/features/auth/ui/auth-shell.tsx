"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Badge } from "@repo/ui"

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 overflow-hidden px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-sky-200/70 via-amber-50 to-cyan-100 p-10 text-slate-900 shadow-xl lg:flex lg:flex-col">
        <Badge className="w-fit bg-slate-900 text-slate-100 hover:bg-slate-900">
          taste_spec_kit
        </Badge>
        <h1 className="mt-6 max-w-md font-[family-name:var(--font-heading)] text-5xl font-bold leading-tight">
          Build secure auth without ugly screens.
        </h1>
        <p className="mt-4 max-w-lg text-base text-slate-700">
          Clean form flows, strong session rules, and a migration-safe adapter design.
        </p>
        <div className="mt-auto space-y-2 rounded-2xl border border-slate-300/70 bg-white/60 p-5 backdrop-blur">
          <p className="text-sm font-medium">Phase A: REST adapter</p>
          <p className="text-sm text-slate-700">Phase C: swap to better-auth client with same interface.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-2 py-6 md:px-8">
        <div className="w-full max-w-md">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </main>
  )
}
