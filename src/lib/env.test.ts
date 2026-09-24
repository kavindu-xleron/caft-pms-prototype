import { beforeAll, describe, expect, it, vi } from "vitest"
import type { parseEnv as ParseEnv } from "@/lib/env"

const valid = {
  DATABASE_URL: "postgresql://u:p@ep-x-pooler.neon.tech/db",
  DIRECT_URL: "postgresql://u:p@ep-x.neon.tech/db",
  CLERK_SECRET_KEY: "sk_test_x",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
}

let parseEnv: typeof ParseEnv

beforeAll(async () => {
  // The module validates process.env on import, so give it a valid one.
  for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value)
  ;({ parseEnv } = await import("@/lib/env"))
})

describe("parseEnv", () => {
  it("accepts a complete environment and applies defaults", () => {
    const env = parseEnv(valid)
    expect(env.LOG_LEVEL).toBe("info")
    expect(env.NODE_ENV).toBe("development")
  })

  it("names every missing variable in the error", () => {
    const { DATABASE_URL: _db, CLERK_SECRET_KEY: _clerk, ...rest } = valid
    expect(() => parseEnv(rest)).toThrow(/DATABASE_URL[\s\S]*CLERK_SECRET_KEY/)
  })

  it("rejects a malformed URL", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_APP_URL: "nope" })).toThrow(
      /NEXT_PUBLIC_APP_URL/
    )
  })

  it("rejects an unknown log level", () => {
    expect(() => parseEnv({ ...valid, LOG_LEVEL: "verbose" })).toThrow(
      /LOG_LEVEL/
    )
  })
})
