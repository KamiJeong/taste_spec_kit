import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button, Field, FieldDescription, FieldLabel, Input, InputGroup } from "@repo/ui"

const meta = {
  title: "Forms/ComposedForm",
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <form style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <InputGroup>
          <Input placeholder="name@company.com" />
        </InputGroup>
        <FieldDescription>Work email only</FieldDescription>
      </Field>
      <Button type="submit">Submit</Button>
    </form>
  ),
}
