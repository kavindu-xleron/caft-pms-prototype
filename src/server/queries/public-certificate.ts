import "server-only"
import { cache } from "react"
import type { CredentialData } from "@/components/certificate/types"
import { getCertificateState } from "@/lib/certificate-status"
import { toIsoDate, todayDateOnly } from "@/lib/date-only"
import { isPublicToken } from "@/lib/public-token"
import { db } from "@/server/db"

/**
 * What the public sees. Expiring-soon is an admin-only warning, so the public
 * state collapses it into VALID.
 */
export type PublicCertificateState = "VALID" | "EXPIRED" | "REVOKED"

/**
 * Public DTO: display fields only. No internal IDs, no `issuedBy`, no pilot
 * email or phone, no revocation reason.
 */
export type PublicCertificate = {
  token: string
  state: PublicCertificateState
  revokedOn: string | null // YYYY-MM-DD
  credential: CredentialData & { certificateNo: string }
}

/**
 * Shared by the page, its metadata, the QR and PDF routes and the OG image:
 * one database call per request. Malformed tokens never reach the database.
 */
export const getPublicCertificate = cache(
  async (token: string): Promise<PublicCertificate | null> => {
    if (!isPublicToken(token)) return null

    const c = await db.certificate.findUnique({
      where: { publicToken: token },
      select: {
        certificateNo: true,
        issueDate: true,
        validUntil: true,
        flyingHours: true,
        authorizedModels: true,
        competencies: true,
        result: true,
        trainingManager: true,
        authorizedSignatory: true,
        status: true,
        revokedAt: true,
        pilot: { select: { fullName: true, employeeId: true } },
      },
    })
    if (!c) return null

    const state = getCertificateState(c, todayDateOnly())
    return {
      token,
      state: state === "EXPIRING_SOON" ? "VALID" : state,
      revokedOn: c.revokedAt ? toIsoDate(c.revokedAt) : null,
      credential: {
        pilotName: c.pilot.fullName,
        employeeId: c.pilot.employeeId,
        certificateNo: c.certificateNo,
        issueDate: toIsoDate(c.issueDate),
        validUntil: toIsoDate(c.validUntil),
        flyingHours: c.flyingHours.toFixed(1),
        authorizedModels: c.authorizedModels,
        competencies: c.competencies,
        result: c.result,
        trainingManager: c.trainingManager,
        authorizedSignatory: c.authorizedSignatory,
      },
    }
  }
)
