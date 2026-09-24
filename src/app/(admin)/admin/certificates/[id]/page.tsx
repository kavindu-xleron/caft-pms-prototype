import { Ban } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CertificateLinkPanel } from "@/components/admin/CertificateLinkPanel"
import { CertificateManageActions } from "@/components/admin/CertificateManageActions"
import { CertificateStatusBadge } from "@/components/admin/CertificateStatusBadge"
import { PageHeader } from "@/components/admin/PageHeader"
import { CredentialView } from "@/components/certificate/web/CredentialView"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { requireAdminPage } from "@/server/auth"
import {
  type AuditEntry,
  getCertificateDetail,
} from "@/server/queries/certificates"

export async function generateMetadata(
  props: PageProps<"/admin/certificates/[id]">
): Promise<Metadata> {
  await requireAdminPage()
  const cert = await getCertificateDetail((await props.params).id)
  return { title: cert?.credential.certificateNo ?? "Certificate not found" }
}

export default async function CertificateDetailPage(
  props: PageProps<"/admin/certificates/[id]">
) {
  await requireAdminPage()
  const cert = await getCertificateDetail((await props.params).id)
  if (!cert) notFound()
  const { credential: c } = cert
  const active = cert.status === "ACTIVE"

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-2 text-sm text-muted-foreground"
      >
        <Link
          href="/admin/certificates"
          className="rounded-sm hover:text-foreground hover:underline"
        >
          Certificates
        </Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{c.certificateNo}</span>
      </nav>
      <PageHeader
        title={<span className="font-mono">{c.certificateNo}</span>}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <CertificateStatusBadge state={cert.state} />
            <Link
              href={`/admin/pilots/${cert.pilotId}`}
              className="hover:text-foreground hover:underline"
            >
              {c.pilotName}
            </Link>
          </span>
        }
        actions={
          active && (
            <CertificateManageActions
              certificateId={cert.id}
              certificateNo={c.certificateNo}
            />
          )
        }
      />

      {cert.status === "REVOKED" && (
        <Alert variant="destructive" className="mb-6">
          <Ban aria-hidden />
          <AlertTitle>
            Revoked{cert.revokedAt && ` on ${formatDate(cert.revokedAt)}`}
          </AlertTitle>
          {cert.revokedReason && (
            <AlertDescription>Reason: {cert.revokedReason}</AlertDescription>
          )}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-6">
          {active && (
            <Card>
              <CardHeader>
                <CardTitle>Share</CardTitle>
              </CardHeader>
              <CardContent>
                <CertificateLinkPanel
                  certificateNo={c.certificateNo}
                  publicUrl={cert.publicUrl}
                  qrPath={cert.qrPath}
                />
              </CardContent>
            </Card>
          )}
          <CredentialView data={c} nameAs="h2" />
        </div>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4 text-sm">
              {cert.history.map((entry) => (
                <li key={entry.id} className="border-l-2 pl-3">
                  <p className="font-medium">{describe(entry)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.createdAt)} · {actorLabel(entry.actorId)}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

const FIELD_LABELS: Record<string, string> = {
  issueDate: "issue date",
  validUntil: "valid until",
  flyingHours: "flying hours",
  authorizedModels: "models",
  competencies: "competencies",
  result: "result",
  trainingManager: "training manager",
  authorizedSignatory: "authorized signatory",
}

function describe(entry: AuditEntry): string {
  const diff = (entry.diff ?? {}) as Record<string, unknown>
  switch (entry.action) {
    case "certificate.issued":
      return "Issued"
    case "certificate.updated":
      return `Edited ${Object.keys(diff)
        .map((k) => FIELD_LABELS[k] ?? k)
        .join(", ")}`
    case "certificate.revoked":
      return typeof diff.reason === "string"
        ? `Revoked: ${diff.reason}`
        : "Revoked"
    case "certificate.link_regenerated":
      return "New public link created"
    default:
      return entry.action
  }
}

/** Clerk user IDs are opaque; show a short, stable form. */
function actorLabel(actorId: string) {
  return actorId.startsWith("user_") ? `admin …${actorId.slice(-6)}` : actorId
}
