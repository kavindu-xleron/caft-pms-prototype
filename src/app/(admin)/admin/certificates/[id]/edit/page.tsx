import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CertificateForm } from "@/components/admin/CertificateForm"
import { EmptyState } from "@/components/admin/EmptyState"
import { PageHeader } from "@/components/admin/PageHeader"
import { buttonVariants } from "@/components/ui/button"
import { requireAdminPage } from "@/server/auth"
import { getCertificateForEdit } from "@/server/queries/certificates"

export const metadata: Metadata = { title: "Edit certificate" }

export default async function EditCertificatePage(
  props: PageProps<"/admin/certificates/[id]/edit">
) {
  await requireAdminPage()
  const cert = await getCertificateForEdit((await props.params).id)
  if (!cert) notFound()

  if (cert.status === "REVOKED") {
    return (
      <EmptyState
        title="Revoked certificates can’t be edited"
        description={`${cert.certificateNo} was revoked, so its details are final.`}
        action={
          <Link
            href={`/admin/certificates/${cert.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to certificate
          </Link>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        title={`Edit ${cert.certificateNo}`}
        description="The certificate number and public link stay the same. Every change is recorded."
      />
      <CertificateForm
        mode="edit"
        certificateId={cert.id}
        pilot={cert.pilot}
        defaultValues={{ ...cert.values, pilotId: cert.pilot.id }}
      />
    </>
  )
}
