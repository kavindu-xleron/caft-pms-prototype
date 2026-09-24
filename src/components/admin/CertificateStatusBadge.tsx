import { Ban, CalendarX, CircleCheck, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CertificateState } from "@/lib/certificate-status"
import { cn } from "@/lib/utils"

const STATES: Record<
  CertificateState,
  { label: string; icon: typeof Ban; className: string }
> = {
  VALID: {
    label: "Valid",
    icon: CircleCheck,
    className: "bg-success text-success-foreground",
  },
  EXPIRING_SOON: {
    label: "Expiring soon",
    icon: Clock,
    className: "bg-warning text-warning-foreground",
  },
  EXPIRED: {
    label: "Expired",
    icon: CalendarX,
    className: "border-border bg-muted text-muted-foreground",
  },
  REVOKED: {
    label: "Revoked",
    icon: Ban,
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/** Admin status badge: colour is always paired with an icon and a label. */
export function CertificateStatusBadge({
  state,
  className,
}: {
  state: CertificateState
  className?: string
}) {
  const { label, icon: Icon, className: stateClass } = STATES[state]
  return (
    <Badge className={cn(stateClass, className)}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}
