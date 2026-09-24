import { requireAdminPage } from "@/server/auth"

export default async function AdminDashboardPage() {
  // Layouts don't re-render on every navigation, so each page checks too.
  await requireAdminPage()

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Pilot and certificate management arrives in Phases 3–4.
      </p>
    </div>
  )
}
