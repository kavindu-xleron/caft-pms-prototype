"use client"

import { Menu } from "lucide-react"
import { useState } from "react"
import { AdminNav } from "@/components/admin/AdminNav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-lg" aria-label="Open navigation" />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-4">
        <SheetHeader className="p-0 pb-4">
          <SheetTitle className="text-caft-navy dark:text-foreground">
            CAFT Admin
          </SheetTitle>
        </SheetHeader>
        <AdminNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
