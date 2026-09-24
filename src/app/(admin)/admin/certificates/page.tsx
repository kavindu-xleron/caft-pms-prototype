import type { Metadata } from "next"
import { PageHeader } from "@/components/admin/PageHeader"
import { requireAdminPage } from "@/server/auth"

export const metadata: Metadata = { title: "Certificates" }

export default async function CertificatesPage() {
  await requireAdminPage()

  return (
    <PageHeader
      title="Certificates"
      description="Issuing and managing certificates arrives with Phase 4."
    />
  )
}
