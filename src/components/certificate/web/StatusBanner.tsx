import { Ban, CalendarX, ShieldCheck } from "lucide-react"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PublicCertificateState } from "@/server/queries/public-certificate"

/** Colour is always paired with an icon and text, never used alone. */
export function StatusBanner({
  state,
  validUntil,
  revokedOn,
}: {
  state: PublicCertificateState
  validUntil: string
  revokedOn: string | null
}) {
  const variants = {
    VALID: {
      icon: ShieldCheck,
      title: "Verified · Valid",
      detail: `Genuine CAFT certificate, valid until ${formatDate(validUntil)}.`,
      className: "bg-success text-success-foreground",
    },
    EXPIRED: {
      icon: CalendarX,
      title: "Expired",
      detail: `Genuine CAFT certificate, but it expired on ${formatDate(validUntil)} and is no longer valid.`,
      className: "bg-warning text-warning-foreground",
    },
    REVOKED: {
      icon: Ban,
      title: "Revoked",
      detail: `CAFT revoked this certificate${revokedOn ? ` on ${formatDate(revokedOn)}` : ""}. It is no longer valid.`,
      className: "bg-destructive text-white",
    },
  } as const
  const { icon: Icon, title, detail, className } = variants[state]

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-4 sm:px-6",
        className
      )}
    >
      <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-lg leading-tight font-bold">{title}</p>
        <p className="mt-1 text-sm opacity-95">{detail}</p>
      </div>
    </div>
  )
}
