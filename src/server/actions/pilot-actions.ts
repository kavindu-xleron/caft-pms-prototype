"use server"

import { revalidatePath } from "next/cache"
import {
  pilotIdSchema,
  pilotSchema,
  updatePilotSchema,
} from "@/lib/validation/pilot"
import { adminAction } from "@/server/actions/safe-action"
import { pilotService } from "@/server/services/pilot-service"

export const createPilotAction = adminAction(
  "pilot.create",
  pilotSchema,
  async (input, { actorId, log }) => {
    const pilot = await pilotService.create(input, { actorId })
    log.info({ event: "pilot.created", pilotId: pilot.id })
    revalidatePath("/admin/pilots")
    return { id: pilot.id }
  }
)

export const updatePilotAction = adminAction(
  "pilot.update",
  updatePilotSchema,
  async ({ id, ...input }, { actorId, log }) => {
    const result = await pilotService.update(id, input, { actorId })
    log.info({ event: "pilot.updated", pilotId: id, changed: result.changed })
    revalidatePath("/admin/pilots")
    revalidatePath(`/admin/pilots/${id}`)
    return { id }
  }
)

export const deletePilotAction = adminAction(
  "pilot.delete",
  pilotIdSchema,
  async ({ id }, { actorId, log }) => {
    const { deletedCertificates } = await pilotService.delete(id, { actorId })
    log.info({
      event: "pilot.deleted",
      pilotId: id,
      deletedCertificates: deletedCertificates.length,
    })
    revalidatePath("/admin")
    revalidatePath("/admin/pilots")
    revalidatePath("/admin/certificates")
    return { id, deletedCertificates }
  }
)
