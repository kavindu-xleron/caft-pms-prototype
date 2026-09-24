"use client"

import "./globals.css"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <title>Something went wrong | CAFT</title>
        <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            The application failed to load. Please try again.
          </p>
          <Button size="lg" onClick={() => retry()}>
            Try again
          </Button>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
