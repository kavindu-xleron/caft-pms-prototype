import "server-only"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"
import { PrismaClient } from "@/generated/prisma/client"
import { env } from "@/lib/env"

// The Neon pool talks over WebSockets; use `ws` rather than relying on the
// runtime's global WebSocket.
neonConfig.webSocketConstructor = ws

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }),
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Prisma's 2s default maxWait is shorter than a Neon cold start.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  })

const g = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>
}
export const db = g.prisma ?? createClient()
if (env.NODE_ENV !== "production") g.prisma = db
