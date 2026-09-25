"use client"

import { LoaderCircle, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { deletePilotAction } from "@/server/actions/pilot-actions"

export function DeletePilotButton({
  pilotId,
  pilotName,
  activeCertificateCount,
  revokedCertificateNos,
}: {
  pilotId: string
  pilotName: string
  /** Certificates that are not revoked (valid, expiring or expired). */
  activeCertificateCount: number
  revokedCertificateNos: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const blocked = activeCertificateCount > 0
  const revoked = revokedCertificateNos.length
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`

  function onDelete() {
    startTransition(async () => {
      const result = await deletePilotAction({ id: pilotId })
      if (!result.ok) {
        toast.error(result.message)
        setOpen(false)
        return
      }
      const removed = result.data.deletedCertificates.length
      toast.success(
        removed
          ? `${pilotName} and ${plural(removed, "revoked certificate")} deleted`
          : `${pilotName} deleted`
      )
      router.push("/admin/pilots")
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="destructive" size="lg" />}>
        <Trash2 /> Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {blocked ? "This pilot can’t be deleted" : `Delete ${pilotName}?`}
          </DialogTitle>
          <DialogDescription>
            {blocked
              ? `${pilotName} has ${plural(activeCertificateCount, "certificate")} that ${activeCertificateCount === 1 ? "is" : "are"} not revoked. Revoke ${activeCertificateCount === 1 ? "it" : "them"} first, then the pilot can be deleted.`
              : revoked
                ? `This also permanently deletes ${pilotName}’s ${plural(revoked, "revoked certificate")} (${revokedCertificateNos.join(", ")}). Their links and QR codes will show “not found” instead of “Revoked”. This cannot be undone.`
                : "This permanently removes the pilot. This cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" size="lg" disabled={pending} />}
          >
            {blocked ? "Close" : "Cancel"}
          </DialogClose>
          {!blocked && (
            <Button
              variant="destructive"
              size="lg"
              onClick={onDelete}
              disabled={pending}
            >
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {revoked
                ? `Delete pilot and ${plural(revoked, "certificate")}`
                : "Delete pilot"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
