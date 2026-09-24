"use client"

import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page could not be loaded. Please try again.
      </p>
      <Button size="lg" onClick={() => retry()}>
        Try again
      </Button>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
    </div>
  )
}
