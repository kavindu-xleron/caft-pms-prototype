import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import type { PilotInput } from "@/lib/validation/pilot"
import { db } from "@/server/db"
import { conflict, fieldConflict, notFoundError } from "@/server/errors"
import {
  isForeignKeyViolation,
  isUniqueViolation,
  uniqueViolationFields,
} from "@/server/prisma-errors"

type Ctx = { actorId: string }

const PILOT_FIELDS = [
  "fullName",
  "employeeId",
  "email",
  "phone",
  "notes",
] as const

function duplicateEmployeeId(err: unknown, employeeId: string) {
  if (
    isUniqueViolation(err) &&
    uniqueViolationFields(err).includes("employeeId")
  ) {
    return fieldConflict(
      "employeeId",
      `Employee ID ${employeeId} is already used by another pilot`,
      { employeeId }
    )
  }
  return err
}

/** Only the fields that changed, as { field: { from, to } }. */
function diffPilot(
  before: Record<(typeof PILOT_FIELDS)[number], string | null>,
  after: PilotInput
): Prisma.InputJsonObject {
  const diff: Record<string, { from: string | null; to: string | null }> = {}
  for (const field of PILOT_FIELDS) {
    if (before[field] !== after[field]) {
      diff[field] = { from: before[field], to: after[field] }
    }
  }
  return diff
}

export const pilotService = {
  async create(input: PilotInput, { actorId }: Ctx) {
    try {
      return await db.$transaction(async (tx) => {
        const pilot = await tx.pilot.create({
          data: input,
          select: { id: true, employeeId: true },
        })
        await tx.auditLog.create({
          data: {
            actorId,
            action: "pilot.created",
            entityType: "Pilot",
            entityId: pilot.id,
            diff: { employeeId: pilot.employeeId },
          },
        })
        return pilot
      })
    } catch (err) {
      throw duplicateEmployeeId(err, input.employeeId)
    }
  },

  async update(id: string, input: PilotInput, { actorId }: Ctx) {
    try {
      return await db.$transaction(async (tx) => {
        const before = await tx.pilot.findUnique({
          where: { id },
          select: {
            fullName: true,
            employeeId: true,
            email: true,
            phone: true,
            notes: true,
          },
        })
        if (!before) throw notFoundError("Pilot")

        const diff = diffPilot(before, input)
        const pilot = await tx.pilot.update({
          where: { id },
          data: input,
          select: { id: true },
        })
        if (Object.keys(diff).length > 0) {
          await tx.auditLog.create({
            data: {
              actorId,
              action: "pilot.updated",
              entityType: "Pilot",
              entityId: id,
              diff,
            },
          })
        }
        return { ...pilot, changed: Object.keys(diff) }
      })
    } catch (err) {
      throw duplicateEmployeeId(err, input.employeeId)
    }
  },

  /**
   * Deletes a pilot whose certificates are all revoked, together with those
   * revoked certificates. Any certificate that is not revoked (valid, expiring
   * or expired) blocks the delete. Deleted certificates' links and QR codes
   * stop resolving, so the audit row keeps their numbers.
   */
  async delete(id: string, { actorId }: Ctx) {
    const hasActive = (count: number) =>
      conflict(
        `This pilot has ${count} certificate${count === 1 ? "" : "s"} that ${count === 1 ? "is" : "are"} not revoked. Revoke ${count === 1 ? "it" : "them"} first, then delete the pilot.`
      )
    try {
      return await db.$transaction(async (tx) => {
        const pilot = await tx.pilot.findUnique({
          where: { id },
          select: {
            employeeId: true,
            fullName: true,
            certificates: { select: { certificateNo: true, status: true } },
          },
        })
        if (!pilot) throw notFoundError("Pilot")

        const active = pilot.certificates.filter((c) => c.status !== "REVOKED")
        if (active.length > 0) throw hasActive(active.length)

        const deletedCertificates = pilot.certificates.map(
          (c) => c.certificateNo
        )
        // Only revoked rows: a certificate issued concurrently survives and
        // trips the RESTRICT foreign key on the pilot delete below.
        await tx.certificate.deleteMany({
          where: { pilotId: id, status: "REVOKED" },
        })
        await tx.pilot.delete({ where: { id } })
        await tx.auditLog.create({
          data: {
            actorId,
            action: "pilot.deleted",
            entityType: "Pilot",
            entityId: id,
            diff: {
              employeeId: pilot.employeeId,
              fullName: pilot.fullName,
              deletedCertificates,
            },
          },
        })
        return { id, deletedCertificates }
      })
    } catch (err) {
      // A certificate issued between the check and the delete.
      throw isForeignKeyViolation(err) ? hasActive(1) : err
    }
  },
}
