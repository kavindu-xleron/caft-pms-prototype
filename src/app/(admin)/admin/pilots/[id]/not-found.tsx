import Link from "next/link"
import { EmptyState } from "@/components/admin/EmptyState"
import { buttonVariants } from "@/components/ui/button"

export default function PilotNotFound() {
  return (
    <EmptyState
      title="Pilot not found"
      description="This pilot does not exist or has been deleted."
      action={
        <Link
          href="/admin/pilots"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to pilots
        </Link>
      }
    />
  )
}
