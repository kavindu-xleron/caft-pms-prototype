import { CalendarX, CircleCheck, Clock, FilePlus, Users } from "lucide-react"
import Link from "next/link"
import { CertificateStatusBadge } from "@/components/admin/CertificateStatusBadge"
import { EmptyState } from "@/components/admin/EmptyState"
import { PageHeader } from "@/components/admin/PageHeader"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { requireAdminPage } from "@/server/auth"
import { getDashboardStats } from "@/server/queries/certificates"

export default async function AdminDashboardPage() {
  // Layouts don't re-render on every navigation, so each page checks too.
  await requireAdminPage()
  const stats = await getDashboardStats()

  const tiles = [
    {
      label: "Pilots",
      value: stats.totalPilots,
      href: "/admin/pilots",
      icon: Users,
      tone: "",
    },
    {
      label: "Valid",
      hint: "More than 30 days left",
      value: stats.valid,
      href: "/admin/certificates?status=valid",
      icon: CircleCheck,
      tone: "text-caft-green",
    },
    {
      label: "Expiring within 30 days",
      value: stats.expiring,
      href: "/admin/certificates?status=expiring",
      icon: Clock,
      tone: "text-warning-foreground dark:text-warning",
    },
    {
      label: "Expired or revoked",
      value: stats.expiredOrRevoked,
      href: "/admin/certificates?status=expired",
      icon: CalendarX,
      tone: "text-muted-foreground",
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <Link
            href="/admin/certificates/new"
            className={buttonVariants({ size: "lg" })}
          >
            <FilePlus aria-hidden /> Issue certificate
          </Link>
        }
      />

      <ul className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, hint, value, href, icon: Icon, tone }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                {label}
                <Icon className={cn("size-4 shrink-0", tone)} aria-hidden />
              </span>
              <span className="text-3xl font-semibold tabular-nums">
                {formatCount(value)}
              </span>
              {hint && (
                <span className="text-xs text-muted-foreground">{hint}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {stats.expiring > 0 && (
        <p className="-mt-4 mb-8 text-sm">
          <Link
            href="/admin/certificates?status=expiring"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-warning px-4 font-medium text-warning-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9"
          >
            <Clock className="size-4" aria-hidden />
            {stats.expiring} expiring soon: review renewals
          </Link>
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recently issued</CardTitle>
          <Link
            href="/admin/certificates"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <EmptyState
              title="No certificates yet"
              description="Issued certificates will appear here."
            />
          ) : (
            <ul className="divide-y">
              {stats.recent.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/certificates/${c.id}`}
                    className="-mx-2 flex flex-col gap-1 rounded-md px-2 py-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {c.pilot.fullName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-mono">{c.certificateNo}</span> ·
                        Issued {formatDate(c.issueDate)}
                      </span>
                    </span>
                    <CertificateStatusBadge
                      state={c.state}
                      className="self-start sm:self-center"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
