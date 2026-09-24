import Image from "next/image"
import caftLogo from "@/assets/caft-logo.png"
import caftMark from "@/assets/caft-mark.png"
import { cn } from "@/lib/utils"

/**
 * The CAFT logo. `full` includes "Ceylon Agro Food Tech"; `mark` is the
 * compact leaf + CAFT for small spaces. Size it with a height class (h-*),
 * width follows. In dark mode it sits on a white plate so the grey tagline
 * stays readable.
 */
export function CaftLogo({
  variant = "full",
  plate = true,
  priority,
  className,
}: {
  variant?: "full" | "mark"
  /** White backing in dark mode. Turn off on surfaces that are always white. */
  plate?: boolean
  priority?: boolean
  className?: string
}) {
  const img = (
    <Image
      src={variant === "full" ? caftLogo : caftMark}
      alt="CAFT — Ceylon Agro Food Tech"
      priority={priority}
      className={cn("h-full w-auto", !plate && className)}
    />
  )
  if (!plate) return img
  return (
    <span
      className={cn(
        "inline-flex dark:rounded-lg dark:bg-white dark:p-1.5",
        className
      )}
    >
      {img}
    </span>
  )
}
