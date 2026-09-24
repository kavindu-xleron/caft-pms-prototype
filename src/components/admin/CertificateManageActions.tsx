"use client"

import { Ban, LoaderCircle, Pencil, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  regenerateCertificateLinkAction,
  revokeCertificateAction,
} from "@/server/actions/certificate-actions"

/** Edit, regenerate link and revoke: only offered while the certificate is ACTIVE. */
export function CertificateManageActions({
  certificateId,
  certificateNo,
}: {
  certificateId: string
  certificateNo: string
}) {
  return (
    <>
      <Link
        href={`/admin/certificates/${certificateId}/edit`}
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        <Pencil aria-hidden /> Edit
      </Link>
      <RegenerateLinkDialog
        certificateId={certificateId}
        certificateNo={certificateNo}
      />
      <RevokeDialog
        certificateId={certificateId}
        certificateNo={certificateNo}
      />
    </>
  )
}

function RegenerateLinkDialog({
  certificateId,
  certificateNo,
}: {
  certificateId: string
  certificateNo: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await regenerateCertificateLinkAction({
        id: certificateId,
      })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(
        "New link created. The old link and QR code no longer work."
      )
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        <RefreshCw aria-hidden /> New link
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new link for {certificateNo}?</DialogTitle>
          <DialogDescription>
            Use this if the link has been shared with the wrong people. The
            current link and every printed or shared QR code will stop working,
            and you will need to send the pilot the new one.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" size="lg" disabled={pending} />}
          >
            Cancel
          </DialogClose>
          <Button size="lg" onClick={onConfirm} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            Create new link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevokeDialog({
  certificateId,
  certificateNo,
}: {
  certificateId: string
  certificateNo: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 5) {
      setError("Give a reason of at least 5 characters")
      return
    }
    startTransition(async () => {
      const result = await revokeCertificateAction({
        id: certificateId,
        reason,
      })
      if (!result.ok) {
        setError(result.fieldErrors?.reason?.[0] ?? null)
        toast.error(result.message)
        return
      }
      toast.success(`${certificateNo} revoked`)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="destructive" size="lg" />}>
        <Ban aria-hidden /> Revoke
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onConfirm} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Revoke {certificateNo}?</DialogTitle>
            <DialogDescription>
              The public page and PDF will show this certificate as revoked
              immediately. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="revoke-reason">Reason</FieldLabel>
            <Textarea
              id="revoke-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
              rows={3}
              maxLength={500}
              aria-invalid={!!error}
              autoFocus
            />
            <FieldDescription>
              Kept in the audit log. Not shown on the public page.
            </FieldDescription>
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={pending}
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              disabled={pending}
            >
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              Revoke certificate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
