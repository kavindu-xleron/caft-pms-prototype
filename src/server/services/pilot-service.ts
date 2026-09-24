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

  async delete(id: string, { actorId }: Ctx) {
    const blocked = conflict(
      "This pilot has certificates and cannot be deleted. Revoke the certificates instead."
    )
    try {
      return await db.$transaction(async (tx) => {
        const pilot = await tx.pilot.findUnique({
          where: { id },
          select: {
            employeeId: true,
            fullName: true,
            _count: { select: { certificates: true } },
          },
        })
        if (!pilot) throw notFoundError("Pilot")
        if (pilot._count.certificates > 0) throw blocked

        await tx.pilot.delete({ where: { id } })
        await tx.auditLog.create({
          data: {
            actorId,
            action: "pilot.deleted",
            entityType: "Pilot",
            entityId: id,
            diff: { employeeId: pilot.employeeId, fullName: pilot.fullName },
          },
        })
        return { id }
      })
    } catch (err) {
      // A certificate issued between the check and the delete trips the
      // RESTRICT foreign key instead.
      throw isForeignKeyViolation(err) ? blocked : err
    }
  },
}
