import { z } from "zod"
import { COMPETENCIES, DRONE_MODELS } from "@/components/certificate/constants"
import { parseDateOnly } from "@/lib/date-only"

export const RESULTS = ["COMPETENT", "NOT_YET_COMPETENT"] as const
export type CertificateResult = (typeof RESULTS)[number]
export const RESULT_LABELS: Record<CertificateResult, string> = {
  COMPETENT: "Competent / Pass",
  NOT_YET_COMPETENT: "Not yet competent",
}

const isoDate = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => {
      try {
        parseDateOnly(v)
        return true
      } catch {
        return false
      }
    }, `${label} must be a valid date`)

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} must be at most 100 characters`)

/**
 * Labels are stored as strings on the certificate. New values must be one of
 * the current constants; the service also accepts labels already stored on the
 * certificate being edited, so renaming a constant never breaks old records.
 */
const labelList = (min: string) =>
  z
    .array(z.string().trim().min(1).max(100))
    .min(1, min)
    .max(50)
    .transform((list) => [...new Set(list)])

const certificateFields = {
  issueDate: isoDate("Issue date"),
  validUntil: isoDate("Valid until"),
  flyingHours: z
    .string()
    .trim()
    .regex(
      /^\d{1,5}(\.\d)?$/,
      "Enter hours from 0 to 99,999 with at most one decimal place"
    ),
  authorizedModels: labelList("Select at least one drone model"),
  competencies: labelList("Select at least one competency"),
  result: z.enum(RESULTS),
  trainingManager: personName("Training manager"),
  authorizedSignatory: personName("Authorized signatory"),
}

type DateRange = { issueDate: string; validUntil: string }
const validUntilAfterIssue = <T extends DateRange>(v: T) =>
  v.validUntil > v.issueDate
const validUntilIssue = {
  message: "Must be after the issue date",
  path: ["validUntil"],
}

export const issueCertificateSchema = z
  .object({
    pilotId: z.string().min(1, "Choose a pilot"),
    ...certificateFields,
  })
  .refine(validUntilAfterIssue, validUntilIssue)

export const updateCertificateSchema = z
  .object({ id: z.string().min(1), ...certificateFields })
  .refine(validUntilAfterIssue, validUntilIssue)

export type IssueCertificateValues = z.input<typeof issueCertificateSchema>
export type IssueCertificateInput = z.output<typeof issueCertificateSchema>
export type CertificateFormValues = Omit<IssueCertificateValues, "pilotId">
export type CertificateFields = Omit<IssueCertificateInput, "pilotId">

export const revokeCertificateSchema = z.object({
  id: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(5, "Give a reason of at least 5 characters")
    .max(500, "Keep the reason under 500 characters"),
})

export const certificateIdSchema = z.object({ id: z.string().min(1) })

export const ALLOWED_MODELS: readonly string[] = DRONE_MODELS
export const ALLOWED_COMPETENCIES: readonly string[] = COMPETENCIES

export const CERTIFICATE_FILTERS = [
  "all",
  "valid",
  "expiring",
  "expired",
  "revoked",
] as const
export type CertificateFilter = (typeof CERTIFICATE_FILTERS)[number]

export const certificateListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: z.enum(CERTIFICATE_FILTERS).catch("all"),
  page: z.coerce.number().int().min(1).catch(1),
})
export type CertificateListQuery = z.output<typeof certificateListQuerySchema>
