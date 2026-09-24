import "server-only"
import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.url(), // Neon pooled
  DIRECT_URL: z.url(), // Neon direct (migrations)
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(), // used in QR + share links
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
})

export type Env = z.infer<typeof schema>

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source)
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}\n\nCheck your .env file against .env.example.`
    )
  }
  return result.data
}

export const env = parseEnv(process.env)
