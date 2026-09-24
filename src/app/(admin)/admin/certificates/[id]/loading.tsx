import { Skeleton } from "@/components/ui/skeleton"

export default function CertificateDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading certificate">
      <Skeleton className="mb-3 h-4 w-48" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-52" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}
