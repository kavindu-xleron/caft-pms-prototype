import type { Prisma } from "@/generated/prisma/client"
import { EXPIRING_SOON_DAYS } from "@/lib/certificate-status"
import { addDaysDateOnly } from "@/lib/date-only"
import type { CertificateFilter } from "@/lib/validation/certificate"

/**
 * Database equivalent of `getCertificateState` for one state. Must stay in
 * step with it (see certificate-filters.test.ts).
 */
export function certificateStateWhere(
  filter: CertificateFilter,
  today: Date
): Prisma.CertificateWhereInput {
  const soonLimit = addDaysDateOnly(today, EXPIRING_SOON_DAYS)
  switch (filter) {
    case "all":
      return {}
    case "revoked":
      return { status: "REVOKED" }
    case "expired":
      return { status: "ACTIVE", validUntil: { lt: today } }
    case "expiring":
      return { status: "ACTIVE", validUntil: { gte: today, lte: soonLimit } }
    case "valid":
      return { status: "ACTIVE", validUntil: { gt: soonLimit } }
  }
}
