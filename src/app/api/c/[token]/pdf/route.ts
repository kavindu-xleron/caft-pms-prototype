import { randomUUID } from "node:crypto"
import { pdfContentDisposition } from "@/lib/pdf-filename"
import { tokenPrefix } from "@/lib/public-token"
import { childLogger } from "@/server/logger"
import { renderCertificatePdf } from "@/server/pdf/render-certificate-pdf"
import { publicCertificateUrl } from "@/server/public-url"
import { getPublicCertificate } from "@/server/queries/public-certificate"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/c/[token]/pdf">
) {
  const { token } = await ctx.params
  const log = childLogger({
    requestId: request.headers.get("x-request-id") ?? randomUUID(),
    token: tokenPrefix(token),
  })

  try {
    const cert = await getPublicCertificate(token)
    if (!cert) {
      log.warn({ event: "pdf.not_found" })
      return new Response("Not found", { status: 404 })
    }

    const { certificateNo, pilotName } = cert.credential
    const started = performance.now()
    const pdf = await renderCertificatePdf({
      data: cert.credential,
      publicUrl: publicCertificateUrl(token),
      watermark: cert.state === "VALID" ? undefined : cert.state,
    })
    log.info({
      event: "pdf.generated",
      certificateNo,
      state: cert.state,
      bytes: pdf.byteLength,
      durationMs: Math.round(performance.now() - started),
    })

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": pdfContentDisposition(certificateNo, pilotName),
        // Status can change (expiry, revocation): never cache.
        "Cache-Control": "private, no-store",
      },
    })
  } catch (err) {
    log.error({ event: "pdf.generate.failed", err })
    return new Response("Could not generate the PDF. Please try again.", {
      status: 500,
    })
  }
}
