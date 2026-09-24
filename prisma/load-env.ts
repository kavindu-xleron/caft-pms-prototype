import { config } from "dotenv"

// Mirror Next.js precedence for the Prisma CLI and scripts:
// .env.local wins over .env, and real env vars win over both.
config({ path: [".env.local", ".env"], quiet: true })
