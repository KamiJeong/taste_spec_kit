import "@testing-library/jest-dom/vitest"
import React from "react"
import { vi } from "vitest"

vi.mock("next/link", () => {
  return {
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  }
})

vi.mock("@repo/ui", () => {
  const Simple = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <div {...props}>{children}</div>
  )

  return {
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
    Card: Simple,
    CardHeader: Simple,
    CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <h2 {...props}>{children}</h2>
    ),
    CardContent: Simple,
    Input: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
    Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
      <label {...props}>{children}</label>
    ),
    Alert: Simple,
    AlertTitle: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <h3 {...props}>{children}</h3>
    ),
    AlertDescription: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <p {...props}>{children}</p>
    ),
    Badge: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <span {...props}>{children}</span>
    ),
  }
})
