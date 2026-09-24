import "server-only"
import pino from "pino"
import { env } from "@/lib/env"

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: "caft-pilot-certs", env: env.NODE_ENV },
  redact: {
    paths: [
      "*.email",
      "*.phone",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[redacted]",
  },
  ...(env.NODE_ENV === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
})

export type Logger = typeof logger

export const childLogger = (ctx: Record<string, unknown>): Logger =>
  logger.child(ctx)

/** Public tokens are secrets: only ever log a short prefix. */
export const tokenPrefix = (token: string) => token.slice(0, 6)
