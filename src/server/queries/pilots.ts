import "server-only"
import { cache } from "react"
import type { Prisma } from "@/generated/prisma/client"
import {
  type CertificateState,
  getCertificateState,
} from "@/lib/certificate-status"
import { toIsoDate, todayDateOnly } from "@/lib/date-only"
import type { PilotFormValues, PilotListQuery } from "@/lib/validation/pilot"
import { db } from "@/server/db"

export type PilotListItem = {
  id: string
  fullName: string
  employeeId: string
  certificateCount: number
  latest: { certificateNo: string; state: CertificateState } | null
}

export type PilotListResult = {
  rows: PilotListItem[]
  total: number
  page: number
  pageCount: number
}

function orderByFor({
  sort,
  dir,
}: PilotListQuery): Prisma.PilotOrderByWithRelationInput[] {
  switch (sort) {
    case "employeeId":
      return [{ employeeId: dir }]
    case "certificates":
      return [{ certificates: { _count: dir } }, { fullName: "asc" }]
    case "createdAt":
      return [{ createdAt: dir }, { id: "asc" }]
    case "name":
      return [{ fullName: dir }, { id: "asc" }]
  }
}

export async function listPilots(
  query: PilotListQuery
): Promise<PilotListResult> {
  const where: Prisma.PilotWhereInput = query.q
    ? {
        OR: [
          { fullName: { contains: query.q, mode: "insensitive" } },
          { employeeId: { contains: query.q, mode: "insensitive" } },
        ],
      }
    : {}

  const fetchPage = (page: number) =>
    db.pilot.findMany({
      where,
      orderBy: orderByFor(query),
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        _count: { select: { certificates: true } },
        certificates: {
          orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { certificateNo: true, status: true, validUntil: true },
        },
      },
    })

  // Count and page in parallel; re-fetch only if the page was out of range.
  const [total, firstTry] = await Promise.all([
    db.pilot.count({ where }),
    fetchPage(query.page),
  ])
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, pageCount)
  const pilots = page === query.page ? firstTry : await fetchPage(page)

  const today = todayDateOnly()
  return {
    total,
    page,
    pageCount,
    rows: pilots.map((p) => {
      const latest = p.certificates[0]
      return {
        id: p.id,
        fullName: p.fullName,
        employeeId: p.employeeId,
        certificateCount: p._count.certificates,
        latest: latest
          ? {
              certificateNo: latest.certificateNo,
              state: getCertificateState(latest, today),
            }
          : null,
      }
    }),
  }
}

export type PilotCertificateItem = {
  id: string
  certificateNo: string
  issueDate: string // YYYY-MM-DD
  validUntil: string // YYYY-MM-DD
  flyingHours: string
  authorizedModels: string[]
  state: CertificateState
}

export type PilotDetail = {
  id: string
  fullName: string
  employeeId: string
  email: string | null
  phone: string | null
  notes: string | null
  createdAt: string // ISO timestamp
  certificates: PilotCertificateItem[]
}

export const getPilotDetail = cache(
  async (id: string): Promise<PilotDetail | null> => {
    const pilot = await db.pilot.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        email: true,
        phone: true,
        notes: true,
        createdAt: true,
        certificates: {
          orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            certificateNo: true,
            issueDate: true,
            validUntil: true,
            flyingHours: true,
            authorizedModels: true,
            status: true,
          },
        },
      },
    })
    if (!pilot) return null

    const today = todayDateOnly()
    return {
      ...pilot,
      createdAt: pilot.createdAt.toISOString(),
      certificates: pilot.certificates.map((c) => ({
        id: c.id,
        certificateNo: c.certificateNo,
        issueDate: toIsoDate(c.issueDate),
        validUntil: toIsoDate(c.validUntil),
        flyingHours: c.flyingHours.toFixed(1),
        authorizedModels: c.authorizedModels,
        state: getCertificateState(c, today),
      })),
    }
  }
)

export async function getPilotFormValues(
  id: string
): Promise<{ id: string; fullName: string; values: PilotFormValues } | null> {
  const pilot = await db.pilot.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      employeeId: true,
      email: true,
      phone: true,
      notes: true,
    },
  })
  if (!pilot) return null
  return {
    id: pilot.id,
    fullName: pilot.fullName,
    values: {
      fullName: pilot.fullName,
      employeeId: pilot.employeeId,
      email: pilot.email ?? "",
      phone: pilot.phone ?? "",
      notes: pilot.notes ?? "",
    },
  }
}
