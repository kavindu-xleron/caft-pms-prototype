import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/admin/PageHeader"
import { PilotForm } from "@/components/admin/PilotForm"
import { requireAdminPage } from "@/server/auth"
import { getPilotFormValues } from "@/server/queries/pilots"

export const metadata: Metadata = { title: "Edit pilot" }

export default async function EditPilotPage(
  props: PageProps<"/admin/pilots/[id]/edit">
) {
  await requireAdminPage()
  const { id } = await props.params
  const pilot = await getPilotFormValues(id)
  if (!pilot) notFound()

  return (
    <>
      <PageHeader title={`Edit ${pilot.fullName}`} />
      <PilotForm mode="edit" pilotId={pilot.id} defaultValues={pilot.values} />
    </>
  )
}
