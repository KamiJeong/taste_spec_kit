import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const srcRoot = path.resolve(process.cwd(), "src")

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

describe("ui ownership guard", () => {
  it("keeps storybook as consumer layer", () => {
    const allowed = new Set(["stories", "tests", "_shared", "styles.css"])
    for (const entry of readdirSync(srcRoot)) {
      expect(allowed.has(entry), `forbidden src entry: ${entry}`).toBe(true)
    }
  })

  it("enforces @repo/ui import on component stories", () => {
    const storyDir = path.join(srcRoot, "stories", "components")
    const files = walk(storyDir).filter((f) => f.endsWith(".stories.tsx"))
    for (const file of files) {
      const content = readFileSync(file, "utf-8")
      expect(content.includes('from "@repo/ui"')).toBe(true)
    }
  })
})
