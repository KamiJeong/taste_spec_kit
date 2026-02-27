import { getAuthErrorMeta } from "./error-map"

describe("getAuthErrorMeta", () => {
  it("returns mapped auth lock/cooldown messages", () => {
    expect(getAuthErrorMeta("AUTH_ACCOUNT_LOCKED").title).toBe("Account locked")
    expect(getAuthErrorMeta("AUTH_REQUEST_COOLDOWN").title).toBe("Please wait")
  })

  it("returns default message for unknown code", () => {
    expect(getAuthErrorMeta("SOMETHING_NEW")).toEqual({
      title: "Request failed",
      description: "Please try again in a moment.",
    })
  })
})
