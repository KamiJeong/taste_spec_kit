import type { Meta, StoryObj } from "@storybook/react-vite"
import * as UI from "@repo/ui"
import { ComponentDemo } from "./demo-renderer"

const meta = {
  title: "Components/Table",
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ComponentDemo name="Table" ui={UI} />,
}
