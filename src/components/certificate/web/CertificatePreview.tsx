"use client"

import { FileText } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { SHEET_HEIGHT, SHEET_WIDTH } from "@/components/certificate/layout"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Shows the landscape certificate in a dialog, scaled with a CSS transform to
 * fit the available width. `children` is the <CertificateSheet>.
 */
export function CertificatePreview({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full sm:w-auto md:h-9"
          />
        }
      >
        <FileText aria-hidden /> View printable certificate
      </DialogTrigger>
      <DialogContent className="max-h-[95svh] overflow-y-auto p-3 sm:max-w-[min(1180px,96vw)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Printable certificate</DialogTitle>
          <DialogDescription>
            A4 landscape. Download the PDF to print or keep it.
          </DialogDescription>
        </DialogHeader>
        <ScaleToFit>{children}</ScaleToFit>
      </DialogContent>
    </Dialog>
  )
}

function ScaleToFit({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(Math.min(1, entry.contentRect.width / SHEET_WIDTH))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full">
      <div
        className="relative overflow-hidden rounded-md shadow-md ring-1 ring-black/10"
        style={{
          height: scale ? SHEET_HEIGHT * scale : 0,
          width: scale ? SHEET_WIDTH * scale : "100%",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `scale(${scale ?? 1})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
