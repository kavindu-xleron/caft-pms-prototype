import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { parseDateOnly, toIsoDate } from "@/lib/date-only"
import { tokenPrefix } from "@/lib/public-token"
import {
  ALLOWED_COMPETENCIES,
  ALLOWED_MODELS,
  type CertificateFields,
  type IssueCertificateInput,
} from "@/lib/validation/certificate"
import {
  formatCertificateNo,
  generatePublicToken,
} from "@/server/certificate-number"
import { db } from "@/server/db"
import { AppError, conflict, notFoundError } from "@/server/errors"

type Ctx = { actorId: string }
type Tx = Prisma.TransactionClient

/** Only labels from the constants, or ones already on this certificate. */
function assertAllowedLabels(
  fields: CertificateFields,
  existing?: CertificateFields
) {
  const fieldErrors: Record<string, string[]> = {}
  const check = (
    key: "authorizedModels" | "competencies",
    allowed: readonly string[]
  ) => {
    const ok = new Set([...allowed, ...(existing?.[key] ?? [])])
    const bad = fields[key].filter((v) => !ok.has(v))
    if (bad.length) fieldErrors[key] = [`Unknown option: ${bad.join(", ")}`]
  }
  check("authorizedModels", ALLOWED_MODELS)
  check("competencies", ALLOWED_COMPETENCIES)
  if (Object.keys(fieldErrors).length) {
    throw new AppError(
      "VALIDATION",
      "Please fix the highlighted fields",
      undefined,
      { fieldErrors }
    )
  }
}

const toData = (f: CertificateFields) => ({
  issueDate: parseDateOnly(f.issueDate),
  validUntil: parseDateOnly(f.validUntil),
  flyingHours: f.flyingHours,
  authorizedModels: f.authorizedModels,
  competencies: f.competencies,
  result: f.result,
  trainingManager: f.trainingManager,
  authorizedSignatory: f.authorizedSignatory,
})

const EDITABLE_SELECT = {
  issueDate: true,
  validUntil: true,
  flyingHours: true,
  authorizedModels: true,
  competencies: true,
  result: true,
  trainingManager: true,
  authorizedSignatory: true,
} as const

type EditableRow = Prisma.CertificateGetPayload<{
  select: typeof EDITABLE_SELECT
}>

/** Comparable, JSON-safe view of the editable fields. */
function toFields(row: EditableRow): CertificateFields {
  return {
    issueDate: toIsoDate(row.issueDate),
    validUntil: toIsoDate(row.validUntil),
    flyingHours: row.flyingHours.toFixed(1),
    authorizedModels: row.authorizedModels,
    competencies: row.competencies,
    result: row.result,
    trainingManager: row.trainingManager,
    authorizedSignatory: row.authorizedSignatory,
  }
}

function diffFields(
  before: CertificateFields,
  after: CertificateFields
): Prisma.InputJsonObject {
  const normalized = {
    ...after,
    flyingHours: Number(after.flyingHours).toFixed(1),
  }
  const diff: Record<string, Prisma.InputJsonObject> = {}
  for (const key of Object.keys(before) as (keyof CertificateFields)[]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(normalized[key])) {
      diff[key] = { from: before[key], to: normalized[key] }
    }
  }
  return diff
}

async function audit(
  tx: Tx,
  actorId: string,
  action: string,
  entityId: string,
  diff?: Prisma.InputJsonObject
) {
  await tx.auditLog.create({
    data: { actorId, action, entityType: "Certificate", entityId, diff },
  })
}

async function findEditable(tx: Tx, id: string) {
  const cert = await tx.certificate.findUnique({
    where: { id },
    select: {
      ...EDITABLE_SELECT,
      id: true,
      status: true,
      pilotId: true,
      certificateNo: true,
      publicToken: true,
    },
  })
  if (!cert) throw notFoundError("Certificate")
  return cert
}

export const certificateService = {
  async issue({ pilotId, ...fields }: IssueCertificateInput, { actorId }: Ctx) {
    assertAllowedLabels(fields)
    return db.$transaction(async (tx) => {
      const pilot = await tx.pilot.findUnique({
        where: { id: pilotId },
        select: { id: true },
      })
      if (!pilot) {
        throw new AppError(
          "VALIDATION",
          "That pilot no longer exists",
          undefined,
          {
            fieldErrors: { pilotId: ["Choose a pilot"] },
          }
        )
      }

      // Year comes from the issue date, not today. The upsert with increment is
      // one atomic statement, so concurrent issues always get distinct numbers.
      const data = toData(fields)
      const year = data.issueDate.getUTCFullYear()
      const seq = await tx.certificateSequence.upsert({
        where: { year },
        create: { year, lastNo: 1 },
        update: { lastNo: { increment: 1 } },
      })

      const cert = await tx.certificate.create({
        data: {
          ...data,
          pilotId,
          certificateNo: formatCertificateNo(year, seq.lastNo),
          publicToken: generatePublicToken(),
          issuedBy: actorId,
        },
        select: {
          id: true,
          certificateNo: true,
          publicToken: true,
          pilotId: true,
        },
      })
      await audit(tx, actorId, "certificate.issued", cert.id, {
        certificateNo: cert.certificateNo,
        pilotId,
      })
      return cert
    })
  },

  async update(id: string, fields: CertificateFields, { actorId }: Ctx) {
    return db.$transaction(async (tx) => {
      const cert = await findEditable(tx, id)
      if (cert.status === "REVOKED")
        throw conflict("Revoked certificates cannot be edited")

      const before = toFields(cert)
      assertAllowedLabels(fields, before)
      const diff = diffFields(before, fields)
      const changed = Object.keys(diff)
      if (changed.length > 0) {
        // Guard on status so a concurrent revoke wins over this edit.
        const { count } = await tx.certificate.updateMany({
          where: { id, status: "ACTIVE" },
          data: toData(fields),
        })
        if (count === 0) throw conflict("Revoked certificates cannot be edited")
        await audit(tx, actorId, "certificate.updated", id, diff)
      }
      return {
        id,
        pilotId: cert.pilotId,
        certificateNo: cert.certificateNo,
        changed,
      }
    })
  },

  async revoke(id: string, reason: string, { actorId }: Ctx) {
    return db.$transaction(async (tx) => {
      const cert = await findEditable(tx, id)
      const { count } = await tx.certificate.updateMany({
        where: { id, status: "ACTIVE" },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedReason: reason,
        },
      })
      if (count === 0) throw conflict("This certificate is already revoked")
      await audit(tx, actorId, "certificate.revoked", id, { reason })
      return { id, pilotId: cert.pilotId, certificateNo: cert.certificateNo }
    })
  },

  /** New public token: the old link and QR code stop working. */
  async regenerateLink(id: string, { actorId }: Ctx) {
    return db.$transaction(async (tx) => {
      const cert = await findEditable(tx, id)
      if (cert.status === "REVOKED")
        throw conflict("Revoked certificates keep their existing link")
      const publicToken = generatePublicToken()
      await tx.certificate.update({ where: { id }, data: { publicToken } })
      await audit(tx, actorId, "certificate.link_regenerated", id, {
        previousTokenPrefix: tokenPrefix(cert.publicToken),
      })
      return {
        id,
        pilotId: cert.pilotId,
        certificateNo: cert.certificateNo,
        publicToken,
      }
    })
  },
}
