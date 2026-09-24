import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { env } from "@/lib/env"
import { SIGN_IN_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  // Makes OG image and canonical URLs absolute in link previews.
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  applicationName: "CAFT Drone Pilot Certificates",
  title: {
    default: "CAFT Drone Pilot Certificates",
    template: "%s | CAFT",
  },
  description:
    "Verify CAFT — Ceylon Agro Food Tech agricultural drone pilot certificates.",
  openGraph: { siteName: "CAFT — Ceylon Agro Food Tech", locale: "en_LK" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ClerkProvider signInUrl={SIGN_IN_PATH}>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
