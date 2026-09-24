import {
  ChevronRight,
  QrCode,
  FileBadge,
  FilePlus,
  Search,
  SearchX,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { CertificateStatusBadge } from "@/components/admin/CertificateStatusBadge"
import { certificateListHref } from "@/components/admin/certificate-list-href"
import { CopyButton } from "@/components/admin/CopyButton"
import { EmptyState } from "@/components/admin/EmptyState"
import { PageHeader } from "@/components/admin/PageHeader"
import { Pagination } from "@/components/admin/Pagination"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  type CertificateFilter,
  type CertificateListQuery,
  certificateListQuerySchema,
} from "@/lib/validation/certificate"
import { requireAdminPage } from "@/server/auth"
import {
  type CertificateListItem,
  listCertificates,
} from "@/server/queries/certificates"

export const metadata: Metadata = { title: "Certificates" }

const FILTER_LABELS: Record<CertificateFilter, string> = {
  all: "All",
  valid: "Valid",
  expiring: "Expiring soon",
  expired: "Expired",
  revoked: "Revoked",
}

export default async function CertificatesPage(
  props: PageProps<"/admin/certificates">
) {
  await requireAdminPage()
  const query = certificateListQuerySchema.parse(await props.searchParams)
  const { rows, total, page, pageCount } = await listCertificates(query)
  const filtered = query.q !== "" || query.status !== "all"

  const issue = (
    <Link
      href="/admin/certificates/new"
      className={buttonVariants({ size: "lg" })}
    >
      <FilePlus aria-hidden /> Issue certificate
    </Link>
  )

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Every certificate issued, newest first."
        actions={issue}
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips query={query} />
        <form
          role="search"
          action="/admin/certificates"
          className="flex w-full gap-2 sm:max-w-md"
        >
          <label htmlFor="certificate-search" className="sr-only">
            Search certificates
          </label>
          <Input
            id="certificate-search"
            name="q"
            type="search"
            defaultValue={query.q}
            placeholder="Pilot name, employee ID or certificate no."
            className="h-11 md:h-9"
          />
          {query.status !== "all" && (
            <input type="hidden" name="status" value={query.status} />
          )}
          <Button
            type="submit"
            variant="outline"
            className="h-11 md:h-9"
            aria-label="Search"
          >
            <Search aria-hidden />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </form>
      </div>

      {total === 0 ? (
        filtered ? (
          <EmptyState
            icon={<SearchX />}
            title="No certificates match"
            description="Try another status or search term."
            action={
              <Link
                href="/admin/certificates"
                className={buttonVariants({ variant: "outline" })}
              >
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={<FileBadge />}
            title="No certificates yet"
            description="Issue a certificate from a pilot’s profile, or start here."
            action={issue}
          />
        )
      ) : (
        <>
          <CertificateCards rows={rows} />
          <CertificateTable rows={rows} />
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            noun={["certificate", "certificates"]}
            hrefFor={(p) => certificateListHref(query, { page: p })}
          />
        </>
      )}
    </>
  )
}

function FilterChips({ query }: { query: CertificateListQuery }) {
  return (
    <nav
      aria-label="Filter by status"
      className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0"
    >
      <ul className="flex gap-2">
        {(Object.keys(FILTER_LABELS) as CertificateFilter[]).map((status) => {
          const active = query.status === status
          return (
            <li key={status}>
              <Link
                href={certificateListHref(query, { status, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9",
                  active &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {FILTER_LABELS[status]}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function CertificateCards({ rows }: { rows: CertificateListItem[] }) {
  return (
    <ul className="divide-y rounded-xl border md:hidden">
      {rows.map((c) => (
        <li key={c.id}>
          <Link
            href={`/admin/certificates/${c.id}`}
            className="flex items-center gap-3 p-4 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="truncate font-medium">{c.pilot.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{c.certificateNo}</span> · Valid
                  until {formatDate(c.validUntil)}
                </p>
              </div>
              <CertificateStatusBadge state={c.state} />
            </div>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function CertificateTable({ rows }: { rows: CertificateListItem[] }) {
  return (
    <div className="hidden rounded-xl border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Certificate No.</TableHead>
            <TableHead>Pilot</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Valid until</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="pl-4 font-mono font-medium">
                <Link
                  href={`/admin/certificates/${c.id}`}
                  className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {c.certificateNo}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/pilots/${c.pilot.id}`}
                  className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {c.pilot.fullName}
                </Link>
                <span className="block font-mono text-xs text-muted-foreground">
                  {c.pilot.employeeId}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">
                {formatDate(c.issueDate)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatDate(c.validUntil)}
              </TableCell>
              <TableCell>
                <CertificateStatusBadge state={c.state} />
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <CopyButton
                    value={c.publicUrl}
                    label="Copy link"
                    variant="ghost"
                    size="sm"
                    aria-label={`Copy public link for ${c.certificateNo}`}
                  />
                  <a
                    href={`${c.qrPath}?download=1`}
                    download
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    aria-label={`Download QR code for ${c.certificateNo}`}
                  >
                    <QrCode aria-hidden /> QR
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
