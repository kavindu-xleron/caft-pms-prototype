import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { SIGN_IN_PATH } from "@/lib/routes"

export default function Forbidden() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">403</p>
      <h1 className="text-xl font-semibold">Admin access required</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your account is signed in but does not have admin access. Ask a CAFT
        administrator to grant it, or sign in with a different account.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <SignOutButton redirectUrl={SIGN_IN_PATH}>
          <Button size="lg">Sign in with another account</Button>
        </SignOutButton>
        <Link
          href="/"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
