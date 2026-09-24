import { UserButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import { requireAdminPage } from "@/server/auth"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | CAFT Admin" },
  robots: { index: false },
}

// Minimal shell for the admin gate; the full sidebar arrives in Phase 3.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminPage()

  return (
    <div className="flex min-h-svh flex-col border-t-4 border-caft-green">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-semibold text-caft-navy">CAFT Admin</span>
        <UserButton />
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
