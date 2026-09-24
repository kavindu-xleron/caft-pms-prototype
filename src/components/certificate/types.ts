import type { CertificateResult } from "@/lib/validation/certificate"

/**
 * Display fields shared by the web credential view and the PDF. Plain,
 * serialisable values only: dates are YYYY-MM-DD strings.
 */
export type CredentialData = {
  pilotName: string
  employeeId: string
  certificateNo: string | null // null while previewing before issue
  issueDate: string
  validUntil: string
  flyingHours: string
  authorizedModels: string[]
  competencies: string[]
  result: CertificateResult
  trainingManager: string
  authorizedSignatory: string
}
