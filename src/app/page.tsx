import { CaftLogo } from "@/components/brand/CaftLogo"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 border-t-4 border-caft-green p-6 text-center">
      <CaftLogo priority className="mb-4 h-32" />
      <h1 className="text-2xl font-semibold text-caft-green">
        Agricultural Drone Pilot Certificates
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Scan the QR code on a certificate, or open its link, to verify it.
      </p>
    </main>
  )
}
