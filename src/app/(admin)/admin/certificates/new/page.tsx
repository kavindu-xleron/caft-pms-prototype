import type { Metadata } from "next"
import { CertificateForm } from "@/components/admin/CertificateForm"
import { PageHeader } from "@/components/admin/PageHeader"
import { requireAdminPage } from "@/server/auth"
import { getIssueFormData } from "@/server/queries/certificates"

export const metadata: Metadata = { title: "Issue certificate" }

export default async function IssueCertificatePage(
  props: PageProps<"/admin/certificates/new">
) {
  await requireAdminPage()
  const { pilotId } = await props.searchParams
  const { pilots, defaults } = await getIssueFormData()
  const preselected = pilots.find((p) => p.id === pilotId)

  return (
    <>
      <PageHeader
        title="Issue certificate"
        description={
          preselected
            ? `For ${preselected.fullName}. You’ll review the certificate before it is issued.`
            : "You’ll review the certificate before it is issued."
        }
      />
      <CertificateForm
        mode="issue"
        pilots={pilots}
        defaultValues={{ ...defaults, pilotId: preselected?.id ?? "" }}
      />
    </>
  )
}
