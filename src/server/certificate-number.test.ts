import { describe, expect, it } from "vitest"
import {
  formatCertificateNo,
  generatePublicToken,
} from "@/server/certificate-number"
import { isPublicToken } from "@/lib/public-token"

describe("formatCertificateNo", () => {
  it("pads to three digits", () => {
    expect(formatCertificateNo(2026, 1)).toBe("ADP-2026-001")
    expect(formatCertificateNo(2026, 42)).toBe("ADP-2026-042")
  })

  it("keeps growing past 999", () => {
    expect(formatCertificateNo(2026, 1234)).toBe("ADP-2026-1234")
  })
})

describe("generatePublicToken", () => {
  it("is 22 url-safe characters and unique", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generatePublicToken))
    expect(tokens.size).toBe(1000)
    for (const t of tokens) expect(isPublicToken(t)).toBe(true)
  })

  it("rejects malformed tokens", () => {
    for (const t of [
      "",
      "short",
      "a".repeat(23),
      "has space in it 1234567",
      "../../etc/passwd000000",
    ]) {
      expect(isPublicToken(t)).toBe(false)
    }
  })
})
