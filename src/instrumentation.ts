import type { Instrumentation } from "next"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validates env at boot: a missing variable stops the server here,
    // not at the first request that happens to need it.
    try {
      await import("@/lib/env")
    } catch (err) {
      console.error(err instanceof Error ? err.message : err)
      process.exit(1)
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const { logger } = await import("@/server/logger")
  const digest =
    typeof err === "object" && err !== null && "digest" in err
      ? String(err.digest)
      : undefined
  logger.error({
    event: "request.unhandled",
    err,
    digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
  })
}
