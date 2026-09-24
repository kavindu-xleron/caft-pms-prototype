import { differenceInCalendarDays } from "date-fns"

export type CertificateState = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED"

export const EXPIRING_SOON_DAYS = 30

/**
 * Expiry is derived, never stored. A certificate is still valid on its
 * `validUntil` date and expires the day after.
 *
 * Both dates are date-only values at 00:00 UTC (see `lib/date-only.ts`);
 * `today` must already be the Asia/Colombo calendar date.
 */
export function getCertificateState(
  c: { status: "ACTIVE" | "REVOKED"; validUntil: Date },
  today: Date
): CertificateState {
  if (c.status === "REVOKED") return "REVOKED"
  if (c.validUntil < today) return "EXPIRED"
  const days = differenceInCalendarDays(c.validUntil, today)
  return days <= EXPIRING_SOON_DAYS ? "EXPIRING_SOON" : "VALID"
}
