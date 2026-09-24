import "server-only"
import { cache } from "react"
import { COMPETENCIES } from "@/components/certificate/constants"
import type { CredentialData } from "@/components/certificate/types"
import type { Prisma } from "@/generated/prisma/client"
import {
  type CertificateState,
  getCertificateState,
} from "@/lib/certificate-status"
import { addYearsDateOnly, toIsoDate, todayDateOnly } from "@/lib/date-only"
import { certificateQrPath } from "@/lib/public-token"
import type {
  CertificateFormValues,
  CertificateListQuery,
} from "@/lib/validation/certificate"
import { db } from "@/server/db"
import { publicCertificateUrl } from "@/server/public-url"
import { certificateStateWhere } from "@/server/queries/certificate-filters"

export const CERTIFICATES_PAGE_SIZE = 20

export type CertificateLinks = { publicUrl: string; qrPath: string }

const links = (token: string): CertificateLinks => ({
  publicUrl: publicCertificateUrl(token),
  qrPath: certificateQrPath(token),
})

export type CertificateListItem = {
  id: string
  certificateNo: string
  pilot: { id: string; fullName: string; employeeId: string }
  issueDate: string
  validUntil: string
  state: CertificateState
} & CertificateLinks

const LIST_SELECT = {
  id: true,
  certificateNo: true,
  publicToken: true,
  issueDate: true,
  validUntil: true,
  status: true,
  pilot: { select: { id: true, fullName: true, employeeId: true } },
} as const satisfies Prisma.CertificateSelect

function toListItem(
  c: Prisma.CertificateGetPayload<{ select: typeof LIST_SELECT }>,
  today: Date
): CertificateListItem {
  return {
    id: c.id,
    certificateNo: c.certificateNo,
    pilot: c.pilot,
    issueDate: toIsoDate(c.issueDate),
    validUntil: toIsoDate(c.validUntil),
    state: getCertificateState(c, today),
    ...links(c.publicToken),
  }
}

export async function listCertificates(query: CertificateListQuery) {
  const today = todayDateOnly()
  const where: Prisma.CertificateWhereInput = {
    AND: [
      certificateStateWhere(query.status, today),
      query.q
        ? {
            OR: [
              { certificateNo: { contains: query.q, mode: "insensitive" } },
              {
                pilot: { fullName: { contains: query.q, mode: "insensitive" } },
              },
              {
                pilot: {
                  employeeId: { contains: query.q, mode: "insensitive" },
                },
              },
            ],
          }
        : {},
    ],
  }

  const fetchPage = (page: number) =>
    db.certificate.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { certificateNo: "desc" }],
      skip: (page - 1) * CERTIFICATES_PAGE_SIZE,
      take: CERTIFICATES_PAGE_SIZE,
      select: LIST_SELECT,
    })

  const [total, firstTry] = await Promise.all([
    db.certificate.count({ where }),
    fetchPage(query.page),
  ])
  const pageCount = Math.max(1, Math.ceil(total / CERTIFICATES_PAGE_SIZE))
  const page = Math.min(query.page, pageCount)
  const rows = page === query.page ? firstTry : await fetchPage(page)

  return { total, page, pageCount, rows: rows.map((c) => toListItem(c, today)) }
}

export type AuditEntry = {
  id: string
  action: string
  actorId: string
  createdAt: string
  diff: unknown
}

export type CertificateDetail = {
  id: string
  status: "ACTIVE" | "REVOKED"
  state: CertificateState
  revokedAt: string | null
  revokedReason: string | null
  createdAt: string
  pilotId: string
  credential: CredentialData & { certificateNo: string }
  history: AuditEntry[]
} & CertificateLinks

export const getCertificateDetail = cache(
  async (id: string): Promise<CertificateDetail | null> => {
    const [c, history] = await Promise.all([
      db.certificate.findUnique({
        where: { id },
        include: {
          pilot: { select: { id: true, fullName: true, employeeId: true } },
        },
      }),
      db.auditLog.findMany({
        where: { entityType: "Certificate", entityId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])
    if (!c) return null

    return {
      id: c.id,
      status: c.status,
      state: getCertificateState(c, todayDateOnly()),
      revokedAt: c.revokedAt?.toISOString() ?? null,
      revokedReason: c.revokedReason,
      createdAt: c.createdAt.toISOString(),
      pilotId: c.pilot.id,
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
      history: history.map((h) => ({
        id: h.id,
        action: h.action,
        actorId: h.actorId,
        createdAt: h.createdAt.toISOString(),
        diff: h.diff,
      })),
      ...links(c.publicToken),
    }
  }
)

export type PilotOption = { id: string; fullName: string; employeeId: string }

export type IssueFormData = {
  pilots: PilotOption[]
  defaults: CertificateFormValues
}

/** Pilots to choose from, plus defaults: today, +1 year, last signatories. */
export async function getIssueFormData(): Promise<IssueFormData> {
  const [pilots, last] = await Promise.all([
    db.pilot.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, employeeId: true },
    }),
    db.certificate.findFirst({
      orderBy: { createdAt: "desc" },
      select: { trainingManager: true, authorizedSignatory: true },
    }),
  ])
  const today = todayDateOnly()
  return {
    pilots,
    defaults: {
      issueDate: toIsoDate(today),
      validUntil: toIsoDate(addYearsDateOnly(today, 1)),
      flyingHours: "",
      authorizedModels: [],
      competencies: [...COMPETENCIES], // all ticked by default
      result: "COMPETENT",
      trainingManager: last?.trainingManager ?? "",
      authorizedSignatory: last?.authorizedSignatory ?? "",
    },
  }
}

export async function getCertificateForEdit(id: string) {
  const detail = await getCertificateDetail(id)
  if (!detail) return null
  const { credential: c } = detail
  const values: CertificateFormValues = {
    issueDate: c.issueDate,
    validUntil: c.validUntil,
    flyingHours: c.flyingHours,
    authorizedModels: c.authorizedModels,
    competencies: c.competencies,
    result: c.result,
    trainingManager: c.trainingManager,
    authorizedSignatory: c.authorizedSignatory,
  }
  return {
    id: detail.id,
    status: detail.status,
    certificateNo: c.certificateNo,
    pilot: {
      id: detail.pilotId,
      fullName: c.pilotName,
      employeeId: c.employeeId,
    },
    values,
  }
}

export type DashboardStats = {
  totalPilots: number
  valid: number
  expiring: number
  expiredOrRevoked: number
  recent: CertificateListItem[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = todayDateOnly()
  const count = (filter: Parameters<typeof certificateStateWhere>[0]) =>
    db.certificate.count({ where: certificateStateWhere(filter, today) })

  const [totalPilots, valid, expiring, expired, revoked, recent] =
    await Promise.all([
      db.pilot.count(),
      count("valid"),
      count("expiring"),
      count("expired"),
      count("revoked"),
      db.certificate.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: LIST_SELECT,
      }),
    ])

  return {
    totalPilots,
    valid,
    expiring,
    expiredOrRevoked: expired + revoked,
    recent: recent.map((c) => toListItem(c, today)),
  }
}
