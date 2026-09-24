import { CircleAlert, CircleCheck } from "lucide-react"
import {
  CERT_BODY,
  CERT_DISCLAIMER,
  CERT_SUBTITLE,
  CERT_TAGLINE,
  CERT_TITLE,
} from "@/components/certificate/constants"
import type { CredentialData } from "@/components/certificate/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { RESULT_LABELS } from "@/lib/validation/certificate"

/**
 * The certificate as a responsive web page (portrait-first). Shared by the
 * admin preview and the public credential page; the PDF is a separate,
 * fixed-layout rendering of the same `CredentialData`.
 */
export function CredentialView({
  data,
  nameAs: NameTag = "h1",
  qrSrc,
  className,
}: {
  data: CredentialData
  /** The pilot's name is the page's h1 on the public page. */
  nameAs?: "h1" | "h2"
  /** Adds a "Scan to verify" QR code to the footer. */
  qrSrc?: string
  className?: string
}) {
  const competent = data.result === "COMPETENT"
  const facts: [string, React.ReactNode][] = [
    [
      "Certificate No.",
      data.certificateNo ?? (
        <span className="text-muted-foreground italic">Assigned on issue</span>
      ),
    ],
    ["Employee ID", data.employeeId],
    ["Issued", formatDate(data.issueDate)],
    ["Valid until", formatDate(data.validUntil)],
    ["Flying hours", data.flyingHours],
  ]

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs",
        className
      )}
    >
      <div className="h-1.5 bg-caft-green" aria-hidden />

      <header className="flex flex-col items-center gap-1 px-4 pt-6 pb-6 text-center sm:px-8 sm:pt-8">
        <CaftWordmark />
        <p className="mt-3 text-lg font-semibold text-caft-green sm:text-xl">
          {CERT_TITLE}
        </p>
        <p className="text-sm font-medium tracking-wide uppercase">
          {CERT_SUBTITLE}
        </p>
        <p className="text-xs text-muted-foreground">{CERT_TAGLINE}</p>

        <p className="mt-6 text-sm text-muted-foreground">
          This is to certify that
        </p>
        <NameTag className="text-2xl font-bold tracking-tight text-balance text-caft-navy uppercase sm:text-3xl dark:text-foreground">
          {data.pilotName}
        </NameTag>
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
            competent
              ? "bg-success text-success-foreground"
              : "bg-warning text-warning-foreground"
          )}
        >
          {competent ? (
            <CircleCheck className="size-4" aria-hidden />
          ) : (
            <CircleAlert className="size-4" aria-hidden />
          )}
          {RESULT_LABELS[data.result]}
        </p>
        <p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">
          {CERT_BODY}
        </p>
      </header>

      <Section title="Certificate details">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium break-words tabular-nums lg:text-sm lg:whitespace-nowrap">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Authorized models">
        <ul className="flex flex-wrap gap-2">
          {data.authorizedModels.map((model) => (
            <li
              key={model}
              className="rounded-full border px-3 py-1 text-sm font-medium"
            >
              {model}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Assessed competencies">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
          {data.competencies.map((competency) => (
            <li key={competency} className="flex items-start gap-2 text-sm">
              <CircleCheck
                className="mt-0.5 size-4 shrink-0 text-caft-green"
                aria-hidden
              />
              {competency}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Signed by">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Signatory role="Training Manager" name={data.trainingManager} />
          <Signatory
            role="Authorized Signatory"
            name={data.authorizedSignatory}
          />
        </dl>
      </Section>

      <footer className="flex items-center gap-4 border-t px-4 py-4 sm:px-8">
        {qrSrc && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from our own route */}
            <img
              src={qrSrc}
              alt="QR code linking to this certificate page"
              width={96}
              height={96}
              className="size-24 rounded-md border bg-white p-1"
            />
            <span className="text-xs font-medium">Scan to verify</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{CERT_DISCLAIMER}</p>
      </footer>
    </article>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t px-4 py-5 sm:px-8">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Signatory({ role, name }: { role: string; name: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{role}</dt>
      <dd className="font-medium">{name}</dd>
    </div>
  )
}

/** Text wordmark until the CAFT logo asset is added. */
function CaftWordmark() {
  return (
    <p className="flex flex-col items-center leading-none">
      <span className="text-3xl font-black tracking-tight text-caft-green">
        CAFT
      </span>
      <span className="mt-1 text-[0.65rem] font-medium tracking-[0.2em] text-caft-navy uppercase dark:text-muted-foreground">
        Ceylon Agro Food Tech
      </span>
    </p>
  )
}
