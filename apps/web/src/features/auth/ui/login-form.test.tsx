import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { LoginFormView } from "./login-form"

const loginMock = vi.fn()

vi.mock("../api/queries", () => ({
  useLoginMutation: () => ({
    mutateAsync: loginMock,
    isPending: false,
  }),
}))

describe("LoginFormView", () => {
  beforeEach(() => {
    loginMock.mockReset()
    loginMock.mockResolvedValue({
      success: true,
      data: { user: { id: "u1", email: "test@example.com" } },
    })
  })

  it("shows required field messages on submit", async () => {
    const user = userEvent.setup()
    render(<LoginFormView />)

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText("Email is required")).toBeInTheDocument()
    expect(await screen.findByText("Password is required")).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it("maps server auth error message", async () => {
    loginMock.mockResolvedValue({
      success: false,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "bad credentials",
    })

    const user = userEvent.setup()
    render(<LoginFormView />)

    await user.type(screen.getByLabelText(/email/i), "user@example.com")
    await user.type(screen.getByLabelText(/password/i), "wrong-password")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
  })
})
