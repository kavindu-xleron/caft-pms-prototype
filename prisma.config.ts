import "./prisma/load-env"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations use the direct (non-pooled) connection. Read leniently so
    // `prisma generate` still works where no database is configured (CI).
    url: process.env.DIRECT_URL,
  },
})
