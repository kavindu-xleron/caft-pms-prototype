import {
  ChevronRight,
  Eye,
  Pencil,
  SearchX,
  UserPlus,
  Users,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { CertificateStatusBadge } from "@/components/admin/CertificateStatusBadge"
import { EmptyState } from "@/components/admin/EmptyState"
import { PageHeader } from "@/components/admin/PageHeader"
import { pilotListHref } from "@/components/admin/pilot-list-href"
import {
  Pagination,
  PilotSearch,
  SortLink,
} from "@/components/admin/PilotListControls"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCount } from "@/lib/format"
import {
  type PilotListQuery,
  pilotListQuerySchema,
} from "@/lib/validation/pilot"
import { requireAdminPage } from "@/server/auth"
import { type PilotListItem, listPilots } from "@/server/queries/pilots"

export const metadata: Metadata = { title: "Pilots" }

export default async function PilotsPage(props: PageProps<"/admin/pilots">) {
  await requireAdminPage()
  const query = pilotListQuerySchema.parse(await props.searchParams)
  const { rows, total, page, pageCount } = await listPilots(query)

  const addPilot = (
    <Link href="/admin/pilots/new" className={buttonVariants({ size: "lg" })}>
      <UserPlus /> Add pilot
    </Link>
  )

  return (
    <>
      <PageHeader
        title="Pilots"
        description="Drone pilots and their certificates."
        actions={addPilot}
      />

      {total === 0 && !query.q ? (
        <EmptyState
          icon={<Users />}
          title="No pilots yet"
          description="Add your first pilot, then issue their certificate."
          action={addPilot}
        />
      ) : (
        <>
          <div className="mb-4">
            <PilotSearch query={query} />
          </div>

          {total === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title={`No pilots match “${query.q}”`}
              description="Check the spelling, or search by employee ID."
              action={
                <Link
                  href={pilotListHref({ ...query, q: "" })}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Clear search
                </Link>
              }
            />
          ) : (
            <>
              <PilotCards rows={rows} />
              <PilotTable rows={rows} query={query} />
              <Pagination
                query={query}
                page={page}
                pageCount={pageCount}
                total={total}
              />
            </>
          )}
        </>
      )}
    </>
  )
}

function LatestStatus({ latest }: { latest: PilotListItem["latest"] }) {
  if (!latest)
    return <span className="text-sm text-muted-foreground">No certificate</span>
  return (
    <span className="flex flex-wrap items-center gap-2">
      <CertificateStatusBadge state={latest.state} />
      <span className="font-mono text-xs text-muted-foreground">
        {latest.certificateNo}
      </span>
    </span>
  )
}

/** Phones: one tappable card per pilot. */
function PilotCards({ rows }: { rows: PilotListItem[] }) {
  return (
    <ul className="divide-y rounded-xl border md:hidden">
      {rows.map((p) => (
        <li key={p.id}>
          <Link
            href={`/admin/pilots/${p.id}`}
            className="flex items-center gap-3 p-4 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="truncate font-medium">{p.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{p.employeeId}</span> ·{" "}
                  {formatCount(p.certificateCount)}{" "}
                  {p.certificateCount === 1 ? "certificate" : "certificates"}
                </p>
              </div>
              <LatestStatus latest={p.latest} />
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

function PilotTable({
  rows,
  query,
}: {
  rows: PilotListItem[]
  query: PilotListQuery
}) {
  return (
    <div className="hidden rounded-xl border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">
              <SortLink query={query} sort="name">
                Name
              </SortLink>
            </TableHead>
            <TableHead>
              <SortLink query={query} sort="employeeId">
                Employee ID
              </SortLink>
            </TableHead>
            <TableHead className="text-right">
              <SortLink query={query} sort="certificates">
                Certificates
              </SortLink>
            </TableHead>
            <TableHead>Latest certificate</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="pl-4 font-medium">
                <Link
                  href={`/admin/pilots/${p.id}`}
                  className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {p.fullName}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {p.employeeId}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCount(p.certificateCount)}
              </TableCell>
              <TableCell>
                <LatestStatus latest={p.latest} />
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <RowAction
                    href={`/admin/pilots/${p.id}`}
                    label={`View ${p.fullName}`}
                  >
                    <Eye />
                  </RowAction>
                  <RowAction
                    href={`/admin/pilots/${p.id}/edit`}
                    label={`Edit ${p.fullName}`}
                  >
                    <Pencil />
                  </RowAction>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RowAction({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={label}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label.split(" ")[0]}</TooltipContent>
    </Tooltip>
  )
}
