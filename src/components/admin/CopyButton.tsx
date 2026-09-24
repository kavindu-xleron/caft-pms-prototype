"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CopyButton({
  value,
  label = "Copy link",
  toastMessage = "Link copied",
  ...buttonProps
}: {
  value: string
  label?: string
  toastMessage?: string
} & Omit<React.ComponentProps<typeof Button>, "onClick" | "value">) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(toastMessage)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.")
    }
  }

  return (
    <Button variant="outline" size="lg" {...buttonProps} onClick={onCopy}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {label}
    </Button>
  )
}
