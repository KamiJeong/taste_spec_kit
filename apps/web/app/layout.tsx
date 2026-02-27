import type { Metadata } from "next"
import { AppQueryProvider } from "@/app/query-provider"
import { DevAuthTools } from "@/features/auth/dev/dev-auth-tools"
import "./globals.css"

export const metadata: Metadata = {
  title: "Taste Spec Kit Auth",
  description: "Email auth frontend",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppQueryProvider>
          {children}
          <DevAuthTools />
        </AppQueryProvider>
      </body>
    </html>
  )
}
