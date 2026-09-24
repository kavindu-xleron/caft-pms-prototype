import Link from "next/link"
import { EmptyState } from "@/components/admin/EmptyState"
import { buttonVariants } from "@/components/ui/button"

export default function CertificateNotFound() {
  return (
    <EmptyState
      title="Certificate not found"
      description="This certificate does not exist."
      action={
        <Link
          href="/admin/certificates"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to certificates
        </Link>
      }
    />
  )
}
