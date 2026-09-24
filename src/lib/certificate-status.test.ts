import { describe, expect, it } from "vitest"
import { getCertificateState } from "@/lib/certificate-status"
import { addDaysDateOnly, parseDateOnly } from "@/lib/date-only"

const today = parseDateOnly("2026-09-24")
const active = (offsetDays: number) => ({
  status: "ACTIVE" as const,
  validUntil: addDaysDateOnly(today, offsetDays),
})

describe("getCertificateState", () => {
  it("is still valid on the validUntil day itself", () => {
    expect(getCertificateState(active(0), today)).toBe("EXPIRING_SOON")
  })

  it("expires the day after validUntil", () => {
    expect(getCertificateState(active(-1), today)).toBe("EXPIRED")
  })

  it("is expiring soon exactly 30 days before validUntil", () => {
    expect(getCertificateState(active(30), today)).toBe("EXPIRING_SOON")
  })

  it("is valid 31 days before validUntil", () => {
    expect(getCertificateState(active(31), today)).toBe("VALID")
  })

  it("reports revoked regardless of dates", () => {
    const revoked = { status: "REVOKED" as const, validUntil: today }
    expect(getCertificateState(revoked, today)).toBe("REVOKED")
    expect(
      getCertificateState(
        { ...revoked, validUntil: addDaysDateOnly(today, -400) },
        today
      )
    ).toBe("REVOKED")
  })
})
