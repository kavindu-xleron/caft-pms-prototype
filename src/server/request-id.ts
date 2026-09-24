import "server-only"
import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { cache } from "react"

/**
 * The incoming `x-request-id`, or a fresh one when the client sent none.
 * Cached per request so every log line in one render shares the same ID.
 */
export const getRequestId = cache(async (): Promise<string> => {
  const h = await headers()
  return h.get("x-request-id") ?? randomUUID()
})
