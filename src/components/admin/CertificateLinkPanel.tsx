"use client"

import { Download, ExternalLink } from "lucide-react"
import { CopyButton } from "@/components/admin/CopyButton"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Public link with copy, QR code with PNG download, and open-in-new-tab. */
export function CertificateLinkPanel({
  certificateNo,
  publicUrl,
  qrPath,
}: {
  certificateNo: string
  publicUrl: string
  qrPath: string
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from our own route */}
      <img
        src={qrPath}
        alt={`QR code linking to certificate ${certificateNo}`}
        width={160}
        height={160}
        className="size-40 shrink-0 self-center rounded-lg border bg-white p-1 sm:self-start"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label
          htmlFor={`link-${certificateNo}`}
          className="text-sm font-medium"
        >
          Public link
        </label>
        <Input
          id={`link-${certificateNo}`}
          readOnly
          value={publicUrl}
          className="h-11 font-mono text-xs sm:h-9"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex flex-wrap gap-2">
          <CopyButton value={publicUrl} />
          <a
            href={`${qrPath}?download=1`}
            download
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Download aria-hidden /> Download QR
          </a>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <ExternalLink aria-hidden /> Open public page
          </a>
        </div>
      </div>
    </div>
  )
}
