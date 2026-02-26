"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

type AppQueryProviderProps = {
  children: ReactNode
}

export function AppQueryProvider({ children }: AppQueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
