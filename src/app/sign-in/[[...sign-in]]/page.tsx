import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { CaftLogo } from "@/components/brand/CaftLogo"
import { ADMIN_HOME_PATH } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false },
}

export default function SignInPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 border-t-4 border-caft-green p-4">
      <CaftLogo priority className="h-20" />
      <SignIn fallbackRedirectUrl={ADMIN_HOME_PATH} />
    </main>
  )
}
