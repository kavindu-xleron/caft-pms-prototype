"use server"

import { revalidatePath } from "next/cache"
import { certificateQrPath } from "@/lib/public-token"
import {
  certificateIdSchema,
  issueCertificateSchema,
  revokeCertificateSchema,
  updateCertificateSchema,
} from "@/lib/validation/certificate"
import { adminAction } from "@/server/actions/safe-action"
import { publicCertificateUrl } from "@/server/public-url"
import { certificateService } from "@/server/services/certificate-service"

/** Every admin view that shows a certificate's status. */
function revalidateCertificate(id: string, pilotId: string) {
  revalidatePath("/admin")
  revalidatePath("/admin/certificates")
  revalidatePath(`/admin/certificates/${id}`)
  revalidatePath("/admin/pilots")
  revalidatePath(`/admin/pilots/${pilotId}`)
}

export const issueCertificateAction = adminAction(
  "certificate.issue",
  issueCertificateSchema,
  async (input, { actorId, log }) => {
    const cert = await certificateService.issue(input, { actorId })
    log.info({
      event: "certificate.issued",
      certificateId: cert.id,
      certificateNo: cert.certificateNo,
      pilotId: cert.pilotId,
    })
    revalidateCertificate(cert.id, cert.pilotId)
    return {
      id: cert.id,
      certificateNo: cert.certificateNo,
      publicUrl: publicCertificateUrl(cert.publicToken),
      qrPath: certificateQrPath(cert.publicToken),
    }
  }
)

export const updateCertificateAction = adminAction(
  "certificate.update",
  updateCertificateSchema,
  async ({ id, ...fields }, { actorId, log }) => {
    const result = await certificateService.update(id, fields, { actorId })
    log.info({
      event: "certificate.updated",
      certificateId: id,
      certificateNo: result.certificateNo,
      changed: result.changed,
    })
    revalidateCertificate(id, result.pilotId)
    return { id, changed: result.changed }
  }
)

export const revokeCertificateAction = adminAction(
  "certificate.revoke",
  revokeCertificateSchema,
  async ({ id, reason }, { actorId, log }) => {
    const result = await certificateService.revoke(id, reason, { actorId })
    log.info({
      event: "certificate.revoked",
      certificateId: id,
      certificateNo: result.certificateNo,
    })
    revalidateCertificate(id, result.pilotId)
    return { id }
  }
)

export const regenerateCertificateLinkAction = adminAction(
  "certificate.regenerate_link",
  certificateIdSchema,
  async ({ id }, { actorId, log }) => {
    const result = await certificateService.regenerateLink(id, { actorId })
    log.info({
      event: "certificate.link_regenerated",
      certificateId: id,
      certificateNo: result.certificateNo,
    })
    revalidateCertificate(id, result.pilotId)
    return {
      publicUrl: publicCertificateUrl(result.publicToken),
      qrPath: certificateQrPath(result.publicToken),
    }
  }
)
