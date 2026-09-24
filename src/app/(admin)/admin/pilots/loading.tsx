import { Skeleton } from "@/components/ui/skeleton"

export default function PilotsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading pilots">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="mb-4 h-11 w-full max-w-md md:h-9" />
      <div className="divide-y rounded-xl border">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-5 w-24 md:block" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
