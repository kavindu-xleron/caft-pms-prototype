import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirectToSignIn: vi.fn(() => {
    throw new Error("REDIRECT_TO_SIGN_IN")
  }),
  forbidden: vi.fn(() => {
    throw new Error("FORBIDDEN_PAGE")
  }),
  warn: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("next/navigation", () => ({ forbidden: mocks.forbidden }))
vi.mock("@/server/logger", () => ({ logger: { warn: mocks.warn } }))

const { requireAdmin, requireAdminPage } = await import("@/server/auth")

function signedInAs(metadata: { role?: string } | undefined) {
  mocks.auth.mockResolvedValue({
    userId: "user_123",
    sessionClaims: metadata === undefined ? {} : { metadata },
    redirectToSignIn: mocks.redirectToSignIn,
  })
}

function signedOut() {
  mocks.auth.mockResolvedValue({
    userId: null,
    sessionClaims: null,
    redirectToSignIn: mocks.redirectToSignIn,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("requireAdmin (actions)", () => {
  it("returns the user ID for an admin", async () => {
    signedInAs({ role: "admin" })
    await expect(requireAdmin()).resolves.toEqual({ userId: "user_123" })
    expect(mocks.warn).not.toHaveBeenCalled()
  })

  it("throws UNAUTHORIZED when signed out", async () => {
    signedOut()
    await expect(requireAdmin()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  it("throws FORBIDDEN and logs auth.forbidden for a non-admin", async () => {
    signedInAs({ role: "viewer" })
    await expect(requireAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" })
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: "auth.forbidden", userId: "user_123" })
    )
  })

  it("hints at the missing session claim when metadata is absent", async () => {
    signedInAs(undefined)
    await expect(requireAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" })
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({ hint: expect.stringContaining("metadata") })
    )
  })
})

describe("requireAdminPage (layouts and pages)", () => {
  it("returns the user ID for an admin", async () => {
    signedInAs({ role: "admin" })
    await expect(requireAdminPage()).resolves.toEqual({ userId: "user_123" })
  })

  it("redirects to sign-in when signed out", async () => {
    signedOut()
    await expect(requireAdminPage()).rejects.toThrow("REDIRECT_TO_SIGN_IN")
    expect(mocks.forbidden).not.toHaveBeenCalled()
  })

  it("renders the 403 page for a non-admin", async () => {
    signedInAs({})
    await expect(requireAdminPage()).rejects.toThrow("FORBIDDEN_PAGE")
    expect(mocks.redirectToSignIn).not.toHaveBeenCalled()
  })
})
