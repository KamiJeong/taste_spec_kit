import * as React from "react"

type Direction = "ltr" | "rtl"

function DirectionProvider({ dir = "ltr", children }: { dir?: Direction; children: React.ReactNode }) {
  return <div dir={dir}>{children}</div>
}

export { DirectionProvider }
