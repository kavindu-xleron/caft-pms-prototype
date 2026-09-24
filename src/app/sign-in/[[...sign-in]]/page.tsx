import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { ADMIN_HOME_PATH } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false },
}

export default function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center border-t-4 border-caft-green p-4">
      <SignIn fallbackRedirectUrl={ADMIN_HOME_PATH} />
    </main>
  )
}
