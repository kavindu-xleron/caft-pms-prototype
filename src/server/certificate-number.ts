import "server-only"
import { randomBytes } from "node:crypto"

export const formatCertificateNo = (year: number, seq: number) =>
  `ADP-${year}-${String(seq).padStart(3, "0")}`

export const generatePublicToken = () => randomBytes(16).toString("base64url")
