import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Pagination({
  page,
  pageCount,
  total,
  noun,
  hrefFor,
}: {
  page: number
  pageCount: number
  total: number
  noun: [singular: string, plural: string]
  hrefFor: (page: number) => string
}) {
  const linkClass = buttonVariants({ variant: "outline", size: "lg" })
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50")
  const prev = (
    <>
      <ChevronLeft aria-hidden />{" "}
      <span className="sr-only sm:not-sr-only">Previous</span>
    </>
  )
  const next = (
    <>
      <span className="sr-only sm:not-sr-only">Next</span>{" "}
      <ChevronRight aria-hidden />
    </>
  )
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-2 text-sm"
    >
      <p className="text-muted-foreground">
        {formatCount(total)} {total === 1 ? noun[0] : noun[1]} · Page {page} of{" "}
        {pageCount}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
            {prev}
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            {prev}
          </span>
        )}
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
            {next}
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            {next}
          </span>
        )}
      </div>
    </nav>
  )
}
