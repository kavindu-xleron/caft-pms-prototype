import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { SIGN_IN_PATH } from "@/lib/routes"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])

// First line of defence only: every admin layout, page and action also
// checks the role on the server (see src/server/auth.ts).
export default clerkMiddleware(
  async (auth, req) => {
    if (isAdminRoute(req)) await auth.protect()
  },
  { signInUrl: SIGN_IN_PATH }
)

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
