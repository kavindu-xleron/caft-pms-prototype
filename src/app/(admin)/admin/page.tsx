import { PageHeader } from "@/components/admin/PageHeader"
import { requireAdminPage } from "@/server/auth"

export default async function AdminDashboardPage() {
  // Layouts don't re-render on every navigation, so each page checks too.
  await requireAdminPage()

  return (
    <PageHeader
      title="Dashboard"
      description="Certificate counts and recent activity arrive with Phase 4."
    />
  )
}
