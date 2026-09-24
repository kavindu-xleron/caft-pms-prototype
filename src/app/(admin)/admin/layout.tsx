import { UserButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import Link from "next/link"
import { AdminNav } from "@/components/admin/AdminNav"
import { CaftLogo } from "@/components/brand/CaftLogo"
import { MobileNav } from "@/components/admin/MobileNav"
import { ADMIN_HOME_PATH } from "@/lib/routes"
import { requireAdminPage } from "@/server/auth"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | CAFT Admin" },
  robots: { index: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminPage()

  return (
    <div className="min-h-svh border-t-4 border-caft-green md:grid md:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-[calc(100svh-4px)] flex-col gap-6 border-r bg-sidebar p-4 md:flex">
        <Link
          href={ADMIN_HOME_PATH}
          className="flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-caft-navy outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-foreground"
        >
          <CaftLogo variant="mark" className="h-9" />
          <span>Admin</span>
        </Link>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <div className="md:hidden">
            <MobileNav />
          </div>
          <span className="flex items-center gap-2 font-semibold text-caft-navy md:hidden dark:text-foreground">
            <CaftLogo variant="mark" className="h-8" />
            <span>Admin</span>
          </span>
          <div className="ml-auto flex items-center pr-2">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
