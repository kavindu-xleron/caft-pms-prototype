import "server-only"
import { env } from "@/lib/env"
import { publicCertificatePath } from "@/lib/public-token"

/** Absolute public link, as encoded in QR codes and share links. */
export const publicCertificateUrl = (token: string) =>
  new URL(publicCertificatePath(token), env.NEXT_PUBLIC_APP_URL).toString()
