import type { Metadata } from "next"
import { PageHeader } from "@/components/admin/PageHeader"
import { PilotForm } from "@/components/admin/PilotForm"
import { requireAdminPage } from "@/server/auth"

export const metadata: Metadata = { title: "Add pilot" }

export default async function NewPilotPage() {
  await requireAdminPage()

  return (
    <>
      <PageHeader
        title="Add pilot"
        description="Certificates can be issued once the pilot is added."
      />
      <PilotForm mode="create" />
    </>
  )
}
