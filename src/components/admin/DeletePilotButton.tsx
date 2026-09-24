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
  certificateCount,
}: {
  pilotId: string
  pilotName: string
  certificateCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const blocked = certificateCount > 0

  function onDelete() {
    startTransition(async () => {
      const result = await deletePilotAction({ id: pilotId })
      if (!result.ok) {
        toast.error(result.message)
        setOpen(false)
        return
      }
      toast.success(`${pilotName} deleted`)
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
              ? `${pilotName} has ${certificateCount} ${certificateCount === 1 ? "certificate" : "certificates"}. Pilots with certificates are kept for the record; revoke a certificate instead if it should no longer be valid.`
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
              Delete pilot
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
