import "server-only"
import { randomUUID } from "node:crypto"
import { headers } from "next/headers"

/** The incoming `x-request-id`, or a fresh one when the client sent none. */
export async function getRequestId(): Promise<string> {
  const h = await headers()
  return h.get("x-request-id") ?? randomUUID()
}
