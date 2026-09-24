"use client"

import { Menu } from "lucide-react"
import { useState } from "react"
import { AdminNav } from "@/components/admin/AdminNav"
import { CaftLogo } from "@/components/brand/CaftLogo"
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
          <SheetTitle className="flex items-center gap-2 text-caft-navy dark:text-foreground">
            <CaftLogo variant="mark" className="h-9" />
            <span>Admin</span>
          </SheetTitle>
        </SheetHeader>
        <AdminNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
