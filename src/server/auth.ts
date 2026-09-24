import "server-only"
import { auth } from "@clerk/nextjs/server"
import { forbidden } from "next/navigation"
import { AppError } from "@/server/errors"
import { logger } from "@/server/logger"

type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "UNAUTHORIZED" }
  | { ok: false; reason: "FORBIDDEN"; userId: string }

async function checkAdmin(): Promise<AdminCheck> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { ok: false, reason: "UNAUTHORIZED" }

  const metadata = sessionClaims?.metadata
  if (metadata?.role === "admin") return { ok: true, userId }

  logger.warn({
    event: "auth.forbidden",
    userId,
    // Without the custom claim every user looks like a non-admin.
    ...(metadata === undefined && {
      hint: "Session token has no `metadata` claim. Add it in Clerk Dashboard → Sessions → Customize session token.",
    }),
  })
  return { ok: false, reason: "FORBIDDEN", userId }
}

/** For server actions and route handlers: throws an `AppError`. */
export async function requireAdmin(): Promise<{ userId: string }> {
  const result = await checkAdmin()
  if (result.ok) return { userId: result.userId }
  if (result.reason === "UNAUTHORIZED") {
    throw new AppError("UNAUTHORIZED", "Please sign in")
  }
  throw new AppError("FORBIDDEN", "Admin access required")
}

/**
 * For admin layouts and pages: redirects signed-out users to sign-in and
 * renders the 403 page for signed-in non-admins.
 */
export async function requireAdminPage(): Promise<{ userId: string }> {
  const result = await checkAdmin()
  if (result.ok) return { userId: result.userId }
  if (result.reason === "UNAUTHORIZED") {
    const { redirectToSignIn } = await auth()
    return redirectToSignIn()
  }
  forbidden()
}
