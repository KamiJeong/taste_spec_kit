import type { Preview } from "@storybook/react-vite"
import React from "react"
import "@repo/ui/styles.css"
import "../src/styles.css"

type ThemeMode = "light" | "dark" | "brand" | "brand-dark"

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.classList.remove("dark", "theme-brand")

  if (mode === "dark") {
    root.classList.add("dark")
    return
  }

  if (mode === "brand") {
    root.classList.add("theme-brand")
    return
  }

  if (mode === "brand-dark") {
    root.classList.add("dark", "theme-brand")
  }
}

const preview: Preview = {
  globalTypes: {
    themeMode: {
      name: "Theme",
      description: "Global theme mode",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "brand", title: "Brand" },
          { value: "brand-dark", title: "Brand Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const status =
        context.parameters.implementationStatus === "in-progress"
          ? "in-progress"
          : "implemented"
      const label = status === "implemented" ? "Implemented" : "In Progress"
      const bgColor = status === "implemented" ? "#065f46" : "#92400e"
      const mode = (context.globals.themeMode ?? "light") as ThemeMode

      applyTheme(mode)

      return React.createElement(
        "div",
        {
          style: { position: "relative", paddingTop: "0.5rem" },
          "data-theme-mode": mode,
        },
        React.createElement(
          "span",
          {
            style: {
              position: "absolute",
              top: "-0.25rem",
              right: 0,
              zIndex: 20,
              borderRadius: "999px",
              padding: "2px 10px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#ffffff",
              backgroundColor: bgColor,
              letterSpacing: "0.02em",
            },
          },
          `Status: ${label}`
        ),
        React.createElement(Story)
      )
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
}

export default preview
