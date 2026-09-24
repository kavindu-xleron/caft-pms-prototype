import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"
import Link from "next/link"
import { pilotListHref } from "@/components/admin/pilot-list-href"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PilotListQuery, PilotSort } from "@/lib/validation/pilot"

/** Plain GET form: works without JavaScript and resets to page 1. */
export function PilotSearch({ query }: { query: PilotListQuery }) {
  return (
    <form
      role="search"
      action="/admin/pilots"
      className="flex w-full gap-2 sm:max-w-md"
    >
      <label htmlFor="pilot-search" className="sr-only">
        Search pilots
      </label>
      <Input
        id="pilot-search"
        name="q"
        type="search"
        defaultValue={query.q}
        placeholder="Search by name or employee ID"
        className="h-11 md:h-9"
      />
      {query.sort !== "name" && (
        <input type="hidden" name="sort" value={query.sort} />
      )}
      {query.dir !== "asc" && (
        <input type="hidden" name="dir" value={query.dir} />
      )}
      {query.pageSize !== 20 && (
        <input type="hidden" name="pageSize" value={query.pageSize} />
      )}
      <Button
        type="submit"
        variant="outline"
        className="h-11 md:h-9"
        aria-label="Search"
      >
        <Search />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  )
}

export function SortLink({
  query,
  sort,
  children,
  className,
}: {
  query: PilotListQuery
  sort: PilotSort
  children: React.ReactNode
  className?: string
}) {
  const active = query.sort === sort
  const nextDir = active && query.dir === "asc" ? "desc" : "asc"
  const Icon = !active ? ArrowUpDown : query.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <Link
      href={pilotListHref(query, { sort, dir: nextDir, page: 1 })}
      className={cn(
        "-mx-2 inline-flex items-center gap-1 rounded-md px-2 py-1 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "text-foreground",
        className
      )}
      aria-label={`Sort by ${String(children)}${active ? `, currently ${query.dir === "asc" ? "ascending" : "descending"}` : ""}`}
    >
      {children}
      <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
    </Link>
  )
}

export function Pagination({
  query,
  page,
  pageCount,
  total,
}: {
  query: PilotListQuery
  page: number
  pageCount: number
  total: number
}) {
  const linkClass = buttonVariants({ variant: "outline", size: "lg" })
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50")
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-2 text-sm"
    >
      <p className="text-muted-foreground">
        {formatCount(total)} {total === 1 ? "pilot" : "pilots"} · Page {page} of{" "}
        {pageCount}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={pilotListHref(query, { page: page - 1 })}
            className={linkClass}
            rel="prev"
          >
            <ChevronLeft />{" "}
            <span className="sr-only sm:not-sr-only">Previous</span>
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeft />{" "}
            <span className="sr-only sm:not-sr-only">Previous</span>
          </span>
        )}
        {page < pageCount ? (
          <Link
            href={pilotListHref(query, { page: page + 1 })}
            className={linkClass}
            rel="next"
          >
            <span className="sr-only sm:not-sr-only">Next</span>{" "}
            <ChevronRight />
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            <span className="sr-only sm:not-sr-only">Next</span>{" "}
            <ChevronRight />
          </span>
        )}
      </div>
    </nav>
  )
}
