import { randomUUID } from "node:crypto"
import QRCode from "qrcode"
import { tokenPrefix } from "@/lib/public-token"
import { childLogger } from "@/server/logger"
import { publicCertificateUrl } from "@/server/public-url"
import { getPublicCertificate } from "@/server/queries/public-certificate"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/c/[token]/qr">
) {
  const { token } = await ctx.params
  const log = childLogger({
    requestId: request.headers.get("x-request-id") ?? randomUUID(),
    token: tokenPrefix(token),
  })

  try {
    const certificateNo = (await getPublicCertificate(token))?.credential
      .certificateNo
    if (!certificateNo) {
      log.warn({ event: "qr.not_found" })
      return new Response("Not found", { status: 404 })
    }

    const png = await QRCode.toBuffer(publicCertificateUrl(token), {
      type: "png",
      errorCorrectionLevel: "M",
      width: 512,
      margin: 2,
    })

    const headers = new Headers({
      "Content-Type": "image/png",
      // A token's URL never changes, so its QR code never does either.
      "Cache-Control": "public, max-age=86400",
    })
    if (new URL(request.url).searchParams.get("download") === "1") {
      headers.set(
        "Content-Disposition",
        `attachment; filename="QR_${certificateNo}.png"`
      )
    }
    return new Response(new Uint8Array(png), { headers })
  } catch (err) {
    log.error({ event: "qr.generate.failed", err })
    return new Response("Something went wrong", { status: 500 })
  }
}
