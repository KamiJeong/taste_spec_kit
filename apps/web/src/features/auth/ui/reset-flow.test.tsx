import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { ForgotPasswordFormView } from "./forgot-password-form"
import { ResetPasswordFormView } from "./reset-password-form"

const forgotPasswordMock = vi.fn()
const resetPasswordMock = vi.fn()

vi.mock("../api/queries", () => ({
  useForgotPasswordMutation: () => ({
    mutateAsync: forgotPasswordMock,
    isPending: false,
  }),
  useResetPasswordMutation: () => ({
    mutateAsync: resetPasswordMock,
    isPending: false,
  }),
}))

describe("Reset flow forms", () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset()
    resetPasswordMock.mockReset()
    forgotPasswordMock.mockResolvedValue({ success: true, data: {} })
    resetPasswordMock.mockResolvedValue({ success: true, data: {} })
  })

  it("submits forgot-password and shows success", async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordFormView />)

    await user.type(screen.getByLabelText(/email/i), "flow@example.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() => expect(forgotPasswordMock).toHaveBeenCalledTimes(1))
    expect(
      screen.getByText("If your account exists, a reset link has been sent."),
    ).toBeInTheDocument()
  })

  it("submits reset-password with token and shows success", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordFormView token="reset-token-1" />)

    await user.type(screen.getByLabelText(/new password/i), "newpassword1")
    await user.type(screen.getByLabelText(/confirm password/i), "newpassword1")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    await waitFor(() => expect(resetPasswordMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText("Password has been reset. You can sign in now.")).toBeInTheDocument()
  })
})
