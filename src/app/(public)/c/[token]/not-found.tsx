import { SearchX } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Certificate not found",
  robots: { index: false, follow: false },
}

export default function CertificateNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 p-6 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">Certificate not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This certificate link is invalid or no longer available. Check that the
        full link was copied, or ask the certificate holder for a new one.
      </p>
    </main>
  )
}
