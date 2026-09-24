import { Skeleton } from "@/components/ui/skeleton"

export default function PilotProfileLoading() {
  return (
    <div aria-busy="true" aria-label="Loading pilot">
      <Skeleton className="mb-3 h-4 w-40" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Skeleton className="h-48" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  )
}
