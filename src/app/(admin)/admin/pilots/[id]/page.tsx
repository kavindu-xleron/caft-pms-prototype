import { FilePlus, FileBadge, Pencil } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CertificateStatusBadge } from "@/components/admin/CertificateStatusBadge"
import { DeletePilotButton } from "@/components/admin/DeletePilotButton"
import { EmptyState } from "@/components/admin/EmptyState"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDate } from "@/lib/format"
import { requireAdminPage } from "@/server/auth"
import { type PilotDetail, getPilotDetail } from "@/server/queries/pilots"

export async function generateMetadata(
  props: PageProps<"/admin/pilots/[id]">
): Promise<Metadata> {
  await requireAdminPage()
  const pilot = await getPilotDetail((await props.params).id)
  return { title: pilot?.fullName ?? "Pilot not found" }
}

export default async function PilotProfilePage(
  props: PageProps<"/admin/pilots/[id]">
) {
  await requireAdminPage()
  const pilot = await getPilotDetail((await props.params).id)
  if (!pilot) notFound()

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-2 text-sm text-muted-foreground"
      >
        <Link
          href="/admin/pilots"
          className="rounded-sm hover:text-foreground hover:underline"
        >
          Pilots
        </Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{pilot.fullName}</span>
      </nav>
      <PageHeader
        title={pilot.fullName}
        description={<span className="font-mono">{pilot.employeeId}</span>}
        actions={
          <>
            <IssueCertificateButton />
            <Link
              href={`/admin/pilots/${pilot.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Pencil /> Edit
            </Link>
            <DeletePilotButton
              pilotId={pilot.id}
              pilotName={pilot.fullName}
              certificateCount={pilot.certificates.length}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <PilotDetails pilot={pilot} />
        <section
          aria-labelledby="certificates-heading"
          className="min-w-0 space-y-3"
        >
          <h2 id="certificates-heading" className="text-lg font-semibold">
            Certificates
          </h2>
          {pilot.certificates.length === 0 ? (
            <EmptyState
              icon={<FileBadge />}
              title="No certificates yet"
              description={`Issue ${pilot.fullName}’s first certificate once they pass the competency assessment.`}
            />
          ) : (
            <ul className="divide-y rounded-xl border">
              {pilot.certificates.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono font-medium">{c.certificateNo}</p>
                    <p className="text-sm text-muted-foreground">
                      Issued {formatDate(c.issueDate)} · Valid until{" "}
                      {formatDate(c.validUntil)} · {c.flyingHours} flying hours
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {c.authorizedModels.join(", ")}
                    </p>
                  </div>
                  <CertificateStatusBadge
                    state={c.state}
                    className="self-start sm:self-center"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function PilotDetails({ pilot }: { pilot: PilotDetail }) {
  const rows: [string, React.ReactNode][] = [
    [
      "Employee ID",
      <span key="id" className="font-mono">
        {pilot.employeeId}
      </span>,
    ],
    ["Email", pilot.email ?? "—"],
    ["Phone", pilot.phone ?? "—"],
    ["Added", formatDate(pilot.createdAt)],
  ]
  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {pilot.notes && (
          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <p className="text-muted-foreground">Notes</p>
            <p className="whitespace-pre-wrap">{pilot.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Wired up to the issue form in Phase 4. */
function IssueCertificateButton() {
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} />}>
        <Button size="lg" disabled>
          <FilePlus /> Issue certificate
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Available once certificate issuing is built (Phase 4)
      </TooltipContent>
    </Tooltip>
  )
}
