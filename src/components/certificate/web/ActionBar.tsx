"use client"

import { Check, Copy, Download, Share2 } from "lucide-react"
import { useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const noopSubscribe = () => () => {}

/** True once hydrated: Share and Copy need JavaScript, Download does not. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

function useCanShare() {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false
  )
}

/**
 * Fixed bottom bar on phones (with safe-area padding); inline from md: up.
 * Pair with bottom padding on the page so it never covers content.
 */
export function ActionBar({
  pdfPath,
  publicUrl,
  pilotName,
  certificateNo,
}: {
  pdfPath: string
  publicUrl: string
  pilotName: string
  certificateNo: string
}) {
  const hydrated = useHydrated()
  const canShare = useCanShare()
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy. Copy the address from your browser instead.")
    }
  }

  async function share() {
    if (!canShare) return copyLink()
    try {
      await navigator.share({
        title: `${pilotName} — Certified Agricultural Drone Pilot`,
        text: `CAFT certificate ${certificateNo} for ${pilotName}`,
        url: publicUrl,
      })
    } catch (err) {
      // Closing the share sheet is not an error.
      if (!(err instanceof DOMException && err.name === "AbortError"))
        await copyLink()
    }
  }

  const big = "h-11 flex-1 md:flex-none"

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-2">
        <a
          href={pdfPath}
          download
          className={buttonVariants({ size: "lg", className: big })}
        >
          <Download aria-hidden /> Download PDF
        </a>
        {hydrated && (
          <>
            <Button variant="outline" size="lg" className={big} onClick={share}>
              <Share2 aria-hidden /> Share
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="size-11 md:w-auto md:px-3"
              onClick={copyLink}
              aria-label="Copy link"
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              <span className="hidden md:inline">Copy link</span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
