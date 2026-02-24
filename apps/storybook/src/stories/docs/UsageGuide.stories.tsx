import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "Docs/UsageGuide",
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Guide: Story = {
  render: () => (
    <article style={{ lineHeight: 1.6 }}>
      <h3>Workflow</h3>
      <ol>
        <li>Generate components in packages/ui</li>
        <li>Export from packages/ui/src/index.ts</li>
        <li>Consume in apps/storybook via @repo/ui</li>
      </ol>
    </article>
  ),
}
