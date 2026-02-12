import type { Meta, StoryObj } from "@storybook/react-vite"
import * as UI from "@repo/ui"
import { ComponentDemo } from "./demo-renderer"

const meta = {
  title: "Components/Input",
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const renderDemo = () => <ComponentDemo name="Input" ui={UI} />

export const Default: Story = {
  render: renderDemo,
}

export const Dark: Story = {
  render: renderDemo,
  globals: { themeMode: "dark" },
}

export const Brand: Story = {
  render: renderDemo,
  globals: { themeMode: "brand" },
}

export const BrandDark: Story = {
  render: renderDemo,
  globals: { themeMode: "brand-dark" },
}
