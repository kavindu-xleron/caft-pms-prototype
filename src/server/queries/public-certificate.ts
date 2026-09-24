import "server-only"
import { cache } from "react"
import { isPublicToken } from "@/lib/public-token"
import { db } from "@/server/db"

/** Certificate number for a public token; malformed tokens never hit the db. */
export const findCertificateNoByToken = cache(
  async (token: string): Promise<string | null> => {
    if (!isPublicToken(token)) return null
    const cert = await db.certificate.findUnique({
      where: { publicToken: token },
      select: { certificateNo: true },
    })
    return cert?.certificateNo ?? null
  }
)
