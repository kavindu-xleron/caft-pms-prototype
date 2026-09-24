import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import { ActionBar } from "@/components/certificate/web/ActionBar"
import { CertificatePreview } from "@/components/certificate/web/CertificatePreview"
import { CertificateSheet } from "@/components/certificate/web/CertificateSheet"
import { CredentialView } from "@/components/certificate/web/CredentialView"
import { StatusBanner } from "@/components/certificate/web/StatusBanner"
import {
  certificatePdfPath,
  certificateQrPath,
  tokenPrefix,
} from "@/lib/public-token"
import { childLogger } from "@/server/logger"
import { publicCertificateUrl } from "@/server/public-url"
import { getPublicCertificate } from "@/server/queries/public-certificate"
import { getRequestId } from "@/server/request-id"

// Status can change at any time (expiry, revocation): never serve a cached copy.
export const dynamic = "force-dynamic"

// Lets the fixed action bar sit above the iPhone home indicator.
export const viewport: Viewport = { viewportFit: "cover" }

const STATE_TEXT = {
  VALID: "Valid",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
} as const

export async function generateMetadata(
  props: PageProps<"/c/[token]">
): Promise<Metadata> {
  const cert = await getPublicCertificate((await props.params).token)
  const robots = { index: false, follow: false }
  if (!cert) return { title: "Certificate not found", robots }
  const { credential: c } = cert
  return {
    title: `${c.pilotName} — Certified Agricultural Drone Pilot`,
    description: `CAFT certificate ${c.certificateNo} · ${STATE_TEXT[cert.state]}`,
    robots,
  }
}

export default async function PublicCertificatePage(
  props: PageProps<"/c/[token]">
) {
  const { token } = await props.params
  const cert = await getPublicCertificate(token)
  if (!cert) {
    childLogger({ requestId: await getRequestId() }).warn({
      event: "public_certificate.not_found",
      token: tokenPrefix(token),
    })
    notFound()
  }

  const { credential: c } = cert
  const qrPath = certificateQrPath(token)

  return (
    <main className="min-h-svh bg-muted/40 pb-28 md:pb-12">
      <div className="h-1.5 bg-caft-green" aria-hidden />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 md:py-10">
        <StatusBanner
          state={cert.state}
          validUntil={c.validUntil}
          revokedOn={cert.revokedOn}
        />
        <ActionBar
          pdfPath={certificatePdfPath(token)}
          publicUrl={publicCertificateUrl(token)}
          pilotName={c.pilotName}
          certificateNo={c.certificateNo}
        />
        <CredentialView data={c} qrSrc={qrPath} />
        <div className="flex justify-center">
          <CertificatePreview>
            <CertificateSheet
              data={c}
              qrSrc={qrPath}
              watermark={cert.state === "VALID" ? undefined : cert.state}
            />
          </CertificatePreview>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Issued by CAFT — Ceylon Agro Food Tech. This page is the live record:
          it always shows the certificate’s current status.
        </p>
      </div>
    </main>
  )
}
