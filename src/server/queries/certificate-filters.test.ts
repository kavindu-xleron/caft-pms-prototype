import { describe, expect, it } from "vitest"
import {
  type CertificateState,
  getCertificateState,
} from "@/lib/certificate-status"
import { addDaysDateOnly, parseDateOnly } from "@/lib/date-only"
import { certificateStateWhere } from "@/server/queries/certificate-filters"

type Range = { lt?: Date; lte?: Date; gt?: Date; gte?: Date }

/** Tiny evaluator for the subset of Prisma filters we generate. */
function matches(
  where: ReturnType<typeof certificateStateWhere>,
  c: { status: "ACTIVE" | "REVOKED"; validUntil: Date }
) {
  if (where.status && where.status !== c.status) return false
  const r = where.validUntil as Range | undefined
  if (!r) return true
  const t = c.validUntil.getTime()
  return (
    (r.lt === undefined || t < r.lt.getTime()) &&
    (r.lte === undefined || t <= r.lte.getTime()) &&
    (r.gt === undefined || t > r.gt.getTime()) &&
    (r.gte === undefined || t >= r.gte.getTime())
  )
}

const FILTER_FOR: Record<
  CertificateState,
  "valid" | "expiring" | "expired" | "revoked"
> = {
  VALID: "valid",
  EXPIRING_SOON: "expiring",
  EXPIRED: "expired",
  REVOKED: "revoked",
}

describe("certificateStateWhere", () => {
  const today = parseDateOnly("2026-09-24")

  it("matches exactly one filter, the one getCertificateState picks", () => {
    for (const status of ["ACTIVE", "REVOKED"] as const) {
      for (let offset = -40; offset <= 40; offset++) {
        const c = { status, validUntil: addDaysDateOnly(today, offset) }
        const expected = FILTER_FOR[getCertificateState(c, today)]
        const hits = (
          ["valid", "expiring", "expired", "revoked"] as const
        ).filter((f) => matches(certificateStateWhere(f, today), c))
        expect(hits, `${status} ${offset}`).toEqual([expected])
      }
    }
  })

  it("'all' matches everything", () => {
    expect(certificateStateWhere("all", today)).toEqual({})
  })
})
