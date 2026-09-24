# CAFT Drone Pilot Certificates — Implementation Plan

**Project:** Agricultural Drone Pilot Showcase & Certificate System (POC)
**Client:** CAFT — Ceylon Agro Food Tech
**Stack:** Next.js (App Router) · shadcn/ui · Clerk · Neon Postgres · Prisma · pnpm
**Author:** Kavindu Sanjula

---

## Table of Contents

1. [Scope Recap](#scope-recap)
2. [Phase 0 — Foundation and Conventions](#phase-0--foundation-and-conventions)
3. [Phase 1 — Database and Prisma](#phase-1--database-and-prisma)
4. [Phase 2 — Authentication and Admin Authorization](#phase-2--authentication-and-admin-authorization)
5. [Phase 3 — Admin Shell and Pilot Management](#phase-3--admin-shell-and-pilot-management)
6. [Phase 4 — Certificate Issuance and Management](#phase-4--certificate-issuance-and-management)
7. [Phase 5 — Public Credential Page (Responsive)](#phase-5--public-credential-page-responsive)
8. [Phase 6 — PDF and QR Generation](#phase-6--pdf-and-qr-generation)
9. [Phase 7 — Sharing and Polish](#phase-7--sharing-and-polish)
10. [Phase 8 — Testing, Hardening and Deployment](#phase-8--testing-hardening-and-deployment)
11. [Phase 9 (Optional) — Signature and Stamp Images](#phase-9-optional--signature-and-stamp-images)
12. [Suggested Order and Effort](#suggested-order-and-effort)

---

## Scope Recap

- **Admin side:** An admin signs in with Clerk and manages pilots. The admin can issue, edit and revoke certificates, and can see every pilot with their certificates. Each certificate has a public link and a QR code the admin can copy or download.
- **Public side:** Anyone with a certificate link sees a responsive, mobile-first verification page. From that page they can download the certificate as an A4 landscape PDF.
- **Signatories (POC):** typed names only. Signature and stamp images are covered in the optional Phase 9.

The web page and the PDF are **two renderings of the same data**:

| Rendering | Purpose | Layout |
|---|---|---|
| Web credential page | Quick verification, usually opened on a phone from a QR code or WhatsApp link | Responsive, portrait-first, widens on larger screens |
| PDF download | Formal document | Fixed A4 landscape, faithful to the original template |

Both use one query (`getPublicCertificate()`) and one shared constants file.

---

## Phase 0 — Foundation and Conventions

**Goal:** Set up the tooling, folder structure and shared building blocks. Every later phase follows the same patterns.

### 0.1 Packages (pnpm)

```bash
# runtime
pnpm add @clerk/nextjs @prisma/client @prisma/adapter-neon @neondatabase/serverless ws \
  zod react-hook-form @hookform/resolvers pino qrcode @react-pdf/renderer \
  date-fns date-fns-tz sonner @tanstack/react-table server-only

# dev
pnpm add -D prisma @types/qrcode @types/ws pino-pretty vitest @vitejs/plugin-react \
  @playwright/test prettier prettier-plugin-tailwindcss tsx

# shadcn components
pnpm dlx shadcn@latest add button card badge input label form table dialog \
  dropdown-menu sheet select checkbox calendar popover separator skeleton \
  alert sonner tabs textarea tooltip

# playwright browsers
pnpm exec playwright install --with-deps chromium
```

### 0.2 pnpm-specific notes

- **Build scripts are blocked by default in pnpm 10+.** Prisma, `@prisma/engines` and some other packages need their install scripts to run. Run `pnpm approve-builds` once, or allow them explicitly in `package.json`:

  ```json
  {
    "pnpm": {
      "onlyBuiltDependencies": ["prisma", "@prisma/engines", "@prisma/client", "esbuild", "sharp"]
    }
  }
  ```

  If `pnpm install` warns about ignored build scripts, check this list first.
- **Lockfile:** commit `pnpm-lock.yaml`. Vercel detects pnpm from the lockfile.
- **Pin the pnpm version** with `"packageManager": "pnpm@<version>"` in `package.json`. Local and CI/Vercel then use the same version (enable with `corepack enable`).
- Use `pnpm dlx` for one-off CLIs and `pnpm exec` for locally installed binaries.
- Don't mix package managers. Delete any `package-lock.json` or `yarn.lock` if one appears.

### 0.3 `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "check": "pnpm lint && pnpm typecheck && pnpm format:check && pnpm test"
  }
}
```

> If your Next.js version no longer ships `next lint`, set the `lint` script to `eslint .`.

### 0.4 Folder structure

```
src/
  app/
    (public)/c/[token]/
      page.tsx                 # responsive credential page
      opengraph-image.tsx      # link preview card
      not-found.tsx
      loading.tsx
    (admin)/admin/
      layout.tsx               # admin shell + requireAdmin()
      page.tsx                 # dashboard
      pilots/page.tsx
      pilots/new/page.tsx
      pilots/[id]/page.tsx
      pilots/[id]/edit/page.tsx
      certificates/page.tsx    # all certificates view
      certificates/new/page.tsx
      error.tsx
      loading.tsx
    api/c/[token]/pdf/route.ts
    api/c/[token]/qr/route.ts
    sign-in/[[...sign-in]]/page.tsx
    error.tsx
    global-error.tsx
    not-found.tsx
    layout.tsx
  components/
    ui/                        # shadcn (avoid heavy hand edits)
    admin/                     # admin-only UI
    certificate/
      constants.ts
      web/                     # CredentialView, StatusBanner, ActionBar, CertificatePreview
      pdf/                     # CertificatePdf (react-pdf)
  server/                      # server-only code, never imported by client
    db.ts                      # Prisma singleton
    auth.ts                    # requireAdmin()
    logger.ts
    errors.ts
    actions/                   # server actions (thin)
    services/                  # business logic
    queries/                   # read models / DTO mappers
  lib/
    env.ts                     # zod-validated env
    action-result.ts           # shared ActionResult type
    validation/                # zod schemas shared by client + server
    format.ts                  # date / number formatting
    certificate-status.ts      # pure status fn (unit tested)
    utils.ts                   # shadcn cn()
  assets/
    fonts/                     # TTF files for react-pdf
    caft-logo.png
  generated/prisma/            # Prisma client output (gitignored)
  instrumentation.ts
  proxy.ts                     # middleware.ts if on Next 15
prisma/
  schema.prisma
  seed.ts
prisma.config.ts
```

**Layering rule:** `actions → services → db`.

- **Actions** handle auth, input validation and the response shape. Nothing else.
- **Services** hold the business rules.
- **Queries** return plain DTOs. Raw Prisma objects with `Decimal` or `Date` values never reach client components.

### 0.5 Environment validation

`src/lib/env.ts`

```ts
import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),           // Neon pooled
  DIRECT_URL: z.string().url(),             // Neon direct (migrations)
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),    // used in QR + share links
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);
```

- If a variable is missing, the app fails at boot instead of at the first request.
- Commit `.env.example` with every key and no values. Keep `.env` gitignored.

### 0.6 Coding Guidelines

#### TypeScript

- Turn on `strict: true` and `noUncheckedIndexedAccess: true`.
- No `any`. Use `unknown` and narrow it.
- Use `type` for data shapes. Use `interface` only for extensible contracts.
- Prefer named exports. Use default exports only where Next.js requires them (`page`, `layout`, `route`, `opengraph-image`).
- Import through the `@/…` alias. No deep relative imports like `../../../`.

#### React / Next.js

- Server Components by default. Add `"use client"` only on leaf components that need state, effects or browser APIs, such as forms, the share button and the data table.
- Every file in `src/server/` starts with `import "server-only"`.
- Mutations go through **Server Actions**. Use **Route Handlers** only for binary or file responses (PDF, QR) and for non-React clients.
- Client components never fetch data. They receive DTOs as props.
- Every data-dependent segment gets a `loading.tsx` built from shadcn `Skeleton`s.

#### Naming

- Components use `PascalCase.tsx`. Utilities use `kebab-case.ts`.
- Server actions start with a verb: `createPilotAction`, `revokeCertificateAction`.
- Service methods are grouped by entity: `certificateService.issue()`.
- Prisma models are `PascalCase`, fields are `camelCase`, and tables are mapped to `snake_case` with `@@map`.

#### Validation

- Each form has one zod schema in `lib/validation/`. React Hook Form uses it on the client, and the action re-validates with it on the server.
- The server never trusts client input.

#### Dates

- Certificate dates are stored as `@db.Date`, with no time part.
- Validity checks and display use the `Asia/Colombo` timezone.
- All date formatting goes through `lib/format.ts`.

#### Styling

- Tailwind and shadcn tokens only. No hard-coded hex values outside `globals.css`.
- The CAFT brand colours (the green and the navy from the template) are defined once as CSS variables.
- Write mobile-first: base styles are for phones, and `sm:` / `md:` / `lg:` enhance larger screens.

#### Git

- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Use one branch per phase: `feat/phase-3-pilots`, and so on.
- `pnpm check` must pass before a merge. Husky with lint-staged is optional:

  ```bash
  pnpm add -D husky lint-staged
  pnpm exec husky init
  ```

### 0.7 Logger

`src/server/logger.ts`

```ts
import "server-only";
import pino from "pino";
import { env } from "@/lib/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: "caft-pilot-certs", env: env.NODE_ENV },
  redact: {
    paths: ["*.email", "*.phone", "req.headers.authorization", "req.headers.cookie"],
    censor: "[redacted]",
  },
  ...(env.NODE_ENV === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});

export const childLogger = (ctx: Record<string, unknown>) => logger.child(ctx);
```

#### Log levels

| Level | Use for |
|---|---|
| `debug` | Noisy development detail |
| `info` | Business events: pilot created, certificate issued or revoked, PDF generated |
| `warn` | Expected failures: validation errors, not-found, unauthorized attempts |
| `error` | Unexpected exceptions (always include `err`) |

#### Fields on every server log line

- `event` — a stable dotted name, e.g. `certificate.issued`, `pdf.generate.failed`
- `requestId` — from the `x-request-id` header, or generated if absent
- `actorId` — the Clerk user ID, on admin actions
- relevant entity IDs: `pilotId`, `certificateId`, `certificateNo`

#### Never log

- Full request bodies.
- Full public tokens. Log only the first 6 characters.
- Clerk session tokens.
- Personal details (PII) beyond what the redact paths already cover.

On Vercel, JSON logs go to stdout and appear in the runtime logs. A log drain such as Axiom or Better Stack can be added later without code changes.

### 0.8 Error Handling

#### Error primitives

`src/server/errors.ts`

```ts
import "server-only";

export type ErrorCode =
  | "VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN"
  | "CONFLICT" | "INTERNAL";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,                 // safe to show user
    public meta?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppError";
  }
}

export const notFoundError = (what: string) => new AppError("NOT_FOUND", `${what} not found`);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
export const forbidden = () => new AppError("FORBIDDEN", "You do not have access to this resource");
```

#### Action result type

`src/lib/action-result.ts` (client-safe):

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; fieldErrors?: Record<string, string[]> };
```

#### Action wrapper

Every admin action goes through this wrapper. It handles auth, validation, logging and error mapping in one place.

`src/server/actions/safe-action.ts`

```ts
import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/server/auth";
import { childLogger } from "@/server/logger";
import { AppError } from "@/server/errors";
import type { ActionResult } from "@/lib/action-result";

export function adminAction<S extends z.ZodTypeAny, R>(
  name: string,
  schema: S,
  handler: (
    input: z.infer<S>,
    ctx: { actorId: string; log: ReturnType<typeof childLogger> },
  ) => Promise<R>,
) {
  return async (raw: unknown): Promise<ActionResult<R>> => {
    const log = childLogger({ action: name });
    try {
      const { userId } = await requireAdmin();
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        log.warn({ event: `${name}.validation_failed` });
        return {
          ok: false,
          code: "VALIDATION",
          message: "Please fix the highlighted fields",
          fieldErrors: z.flattenError(parsed.error).fieldErrors,
        };
      }
      const data = await handler(parsed.data, {
        actorId: userId,
        log: log.child({ actorId: userId }),
      });
      return { ok: true, data };
    } catch (err) {
      if (err instanceof AppError) {
        log.warn({ event: `${name}.failed`, code: err.code, meta: err.meta });
        return { ok: false, code: err.code, message: err.message };
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        log.warn({ event: `${name}.conflict`, target: err.meta?.target });
        return { ok: false, code: "CONFLICT", message: "A record with this value already exists" };
      }
      log.error({ event: `${name}.error`, err });
      return { ok: false, code: "INTERNAL", message: "Something went wrong. Please try again." };
    }
  };
}
```

#### Error handling rules

- **Services** throw `AppError` for expected failures. Unexpected errors bubble up.
- **Actions** never throw to the client. They always return an `ActionResult`. Forms show `message` in a toast and `fieldErrors` inline.
- **Pages** call `notFound()` from `next/navigation` for missing records. Anything else goes to `error.tsx`.
- **Route handlers** wrap their logic in `try/catch` and return proper status codes: 404 for an unknown token, 500 with a generic message otherwise. Errors are logged with `event` and `requestId`.
- **`app/error.tsx`** shows a friendly message, a retry button and the error `digest`. **`global-error.tsx`** catches errors in the root layout.
- **`src/instrumentation.ts`** logs every uncaught server error in one central place:

  ```ts
  export async function onRequestError(
    err: unknown,
    request: { path: string; method: string },
  ) {
    const { logger } = await import("@/server/logger");
    logger.error({ event: "request.unhandled", err, path: request.path, method: request.method });
  }
  ```

- Users never see stack traces, Prisma messages or internal IDs.

### Phase 0 deliverables

- Lint, typecheck and format scripts
- Environment validation
- Logger
- Error primitives
- Folder skeleton
- `globals.css` theme with the CAFT colours

**Done when:**
- `pnpm check` passes.
- A missing env var stops the app at startup with a clear message.

---

## Phase 1 — Database and Prisma

### 1.1 Neon setup

- Create a Neon project with a `main` branch (production) and a `dev` branch (local development).
- Use the **pooled** connection string (the `-pooler` host) as `DATABASE_URL` for the app.
- Use the **direct** connection string as `DIRECT_URL` for migrations.

### 1.2 Prisma config

`prisma.config.ts` (Prisma 7 style):

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"), // migrations use the direct connection
  },
});
```

> **On Prisma 6:** use the `prisma-client-js` generator and put `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")` in the `datasource` block instead. Before starting, check which major version `pnpm add prisma` installed.

### 1.3 Schema

`prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Pilot {
  id           String        @id @default(cuid())
  fullName     String
  employeeId   String        @unique
  email        String?
  phone        String?
  notes        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  certificates Certificate[]

  @@index([fullName])
  @@map("pilots")
}

model Certificate {
  id                  String     @id @default(cuid())
  certificateNo       String     @unique
  publicToken         String     @unique
  pilotId             String
  pilot               Pilot      @relation(fields: [pilotId], references: [id], onDelete: Restrict)
  issueDate           DateTime   @db.Date
  validUntil          DateTime   @db.Date
  flyingHours         Decimal    @db.Decimal(7, 1)
  authorizedModels    String[]
  competencies        String[]
  result              Result     @default(COMPETENT)
  trainingManager     String
  authorizedSignatory String
  status              CertStatus @default(ACTIVE)
  revokedAt           DateTime?
  revokedReason       String?
  issuedBy            String     // Clerk userId
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@index([pilotId])
  @@index([validUntil])
  @@map("certificates")
}

model CertificateSequence {
  year   Int @id
  lastNo Int @default(0)

  @@map("certificate_sequences")
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String
  action     String   // pilot.created, certificate.issued, certificate.revoked...
  entityType String
  entityId   String
  diff       Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@map("audit_logs")
}

enum Result     { COMPETENT NOT_YET_COMPETENT }
enum CertStatus { ACTIVE REVOKED }
```

**Expiry is not stored as a status.** It is derived from `validUntil`, so a certificate can never be left showing ACTIVE after its expiry date.

Add `src/generated/` to `.gitignore`. It is regenerated on every `pnpm build`.

### 1.4 Prisma client singleton

`src/server/db.ts`

```ts
import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "@/lib/env";

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }),
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

const g = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
export const db = g.prisma ?? createClient();
if (env.NODE_ENV !== "production") g.prisma = db;
```

The global cache stops Next.js hot reload from creating a new connection pool on every change.

### 1.5 Seed data

`prisma/seed.ts` creates:

- 3–5 sample pilots
- certificates in every state: valid, expiring within 30 days, expired and revoked

This lets you test every UI state without entering data by hand.

```bash
pnpm db:migrate --name init
pnpm db:seed
pnpm db:studio
```

**Done when:**
- The migration applies cleanly to the Neon `dev` branch.
- The seed runs.
- Prisma Studio shows the seeded data.

---

## Phase 2 — Authentication and Admin Authorization

### 2.1 Clerk setup

- Wrap the root layout in `ClerkProvider` and add a sign-in page at `/sign-in`.
- In the Clerk dashboard, set **sign-ups to Restricted** so admins join by invitation only.
- Also in the dashboard, customise the **session token** to include `{ "metadata": "{{user.public_metadata}}" }`. The role can then be read without an extra API call.
- Give each admin user `publicMetadata: { "role": "admin" }`.

### 2.2 Proxy / middleware

`src/proxy.ts` (use `middleware.ts` on Next 15):

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
```

### 2.3 Server-side role check

The proxy check alone is not enough. Every admin page, layout and action also checks the role on the server. A misconfigured matcher or a bypass bug therefore can't expose admin functions.

`src/server/auth.ts`

```ts
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "@/server/errors";

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new AppError("UNAUTHORIZED", "Please sign in");
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
  if (role !== "admin") throw new AppError("FORBIDDEN", "Admin access required");
  return { userId };
}
```

- The admin `layout.tsx` calls `requireAdmin()`. On failure it redirects to `/sign-in` if the user isn't signed in, and renders a 403 page if the user is signed in but isn't an admin.
- Log `auth.forbidden` at `warn` level, with the `userId`.

**Done when:**
- A signed-out visit to `/admin` redirects to sign-in.
- A signed-in user without the admin role sees the 403 page.
- An admin reaches the dashboard.
- `/c/anything` stays public.

---

## Phase 3 — Admin Shell and Pilot Management

### 3.1 Admin shell

- Sidebar on desktop, `Sheet` drawer on mobile.
- Nav items: Dashboard, Pilots, Certificates.
- Clerk `UserButton` in the header.
- `sonner` Toaster for notifications.

### 3.2 Pilot validation

`lib/validation/pilot.ts`:

- `fullName` — 2–100 characters, trimmed
- `employeeId` — uppercase, matches `^[A-Z0-9-]{2,20}$`
- `email` — optional
- `phone` — optional, Sri Lankan format: `+94` or `0` followed by 9 digits

### 3.3 Pilot service

`server/services/pilot-service.ts` provides:

- `create`, `update`, `getById`
- `list({ q, page, pageSize })`
- `delete` — blocked when the pilot has certificates (throws `CONFLICT`)

Every write creates an `AuditLog` row in the same transaction.

### 3.4 Actions

`createPilotAction`, `updatePilotAction` and `deletePilotAction` are all built with `adminAction()`. After a successful write, each calls `revalidatePath("/admin/pilots")`.

### 3.5 Pages

- **`/admin/pilots`** — a shadcn data table.
  - Columns: name, employee ID, certificate count, latest certificate status, actions.
  - Search, pagination and sorting run on the server through URL `searchParams`, so filtered views can be bookmarked and shared.
  - On mobile, the table collapses to a card list.
- **`/admin/pilots/new`** and **`/admin/pilots/[id]/edit`** — forms built with React Hook Form, zod and shadcn `Form`.
  - The submit button shows a pending state.
  - Server field errors are mapped back onto the inputs.
- **`/admin/pilots/[id]`** — pilot profile.
  - Header with the pilot's details.
  - A list of the pilot's certificates with status badges.
  - An "Issue certificate" button.

**Done when:**
- You can create, edit and search pilots.
- A duplicate employee ID shows an inline error.
- Deleting a pilot who has certificates is blocked with a clear message.

---

## Phase 4 — Certificate Issuance and Management

### 4.1 Constants

`components/certificate/constants.ts`

```ts
export const COMPETENCIES = [
  "Pre / Post-flight Inspection",
  "Manual & Automatic Flight Operation",
  "Spraying & Spreading Operation",
  "Pump / Flow & Spreader Calibration",
  "Mission Planning & Field Mapping",
  "Terrain / Obstacle Awareness",
  "Battery & Chemical Safety",
  "Emergency & Signal-loss Procedures",
  "Basic Troubleshooting & Maintenance",
  "Flight Logs & Company SOPs",
] as const;

export const DRONE_MODELS = ["DJI Agras T25", "DJI Agras T20P"] as const;

export const CERT_TITLE = "Agricultural Drone Pilot";
export const CERT_SUBTITLE = "Certificate of Competency";
export const CERT_TAGLINE = "Company Internal Competency & Operational Authorization";
export const CERT_BODY =
  "has successfully completed the company's Agricultural Drone Pilot Training and Competency Assessment and is assessed as competent to operate approved agricultural unmanned aircraft in accordance with company SOPs, safety requirements and applicable regulations.";
export const CERT_DISCLAIMER =
  "This company certificate confirms internal competency/authorization only and does not replace any licence, approval or certificate required by the applicable aviation authority.";
```

Certificates store the competency and model **labels as strings**. Renaming a constant later does not change certificates already issued.

### 4.2 Certificate number and public token

Generate the certificate number inside the issuing transaction:

```ts
const seq = await tx.certificateSequence.upsert({
  where: { year },
  create: { year, lastNo: 1 },
  update: { lastNo: { increment: 1 } },
});
const certificateNo = `ADP-${year}-${String(seq.lastNo).padStart(3, "0")}`;
```

- The upsert with `increment` is a single atomic statement, so two admins issuing at the same moment always get different numbers.
- `year` comes from `issueDate`, not from today's date.

Generate the public token with:

```ts
import { randomBytes } from "node:crypto";
const publicToken = randomBytes(16).toString("base64url"); // 22 chars, 128-bit
```

### 4.3 Issue form

| Field | Rule / default |
|---|---|
| Pilot | Pre-selected when coming from a pilot profile |
| Issue date | Defaults to today |
| Valid until | Defaults to issue date + 1 year; must be after issue date |
| Flying hours | 0–99,999, one decimal place |
| Authorized models | Multi-select checkboxes; at least one |
| Competencies | All ticked by default; at least one |
| Result | `COMPETENT` by default |
| Training manager / Authorized signatory | Pre-filled from the last issued certificate |

- **Preview step:** before confirming, the admin sees the certificate rendered with `CredentialView`.
- **Success dialog** shows:
  - the certificate number,
  - the public link, with a copy button,
  - the QR code, with a PNG download,
  - an "Open public page" button.

### 4.4 Management

- **Edit certificate** — allowed only while it is `ACTIVE`. The certificate number and token can never change. Every edit is audited, with a diff.
- **Revoke** — needs a confirmation dialog and a required reason. Sets `status = REVOKED` and `revokedAt`, and is audited.
- **Regenerate link** (optional) — creates a new token; the old QR code and link stop working. Useful if a link leaks.
- **`/admin/certificates`** — a table of all certificates.
  - Filter by status: valid, expiring within 30 days, expired, revoked.
  - Search by pilot name or certificate number.

### 4.5 Status function

`lib/certificate-status.ts` is a pure function, covered by unit tests.

```ts
import { differenceInCalendarDays } from "date-fns";

export type CertificateState = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED";

export function getCertificateState(
  c: { status: "ACTIVE" | "REVOKED"; validUntil: Date },
  today: Date, // already normalized to the Asia/Colombo date
): CertificateState {
  if (c.status === "REVOKED") return "REVOKED";
  if (c.validUntil < today) return "EXPIRED";
  const days = differenceInCalendarDays(c.validUntil, today);
  return days <= 30 ? "EXPIRING_SOON" : "VALID";
}
```

- A certificate is still valid **on** its `validUntil` date and expires the day after.
- The public page shows `EXPIRING_SOON` simply as "Valid". The warning is for admins only.

### 4.6 Dashboard

- Four counts: total pilots, valid certificates, expiring within 30 days, expired or revoked.
- The 5 most recently issued certificates.

**Done when:**
- Issuing a certificate creates the next sequential number.
- The success dialog shows a working link and QR code.
- A revoked certificate shows as revoked everywhere in the admin area straight away.
- Every write has an audit log row.

---

## Phase 5 — Public Credential Page (Responsive)

### 5.1 Data access

`server/queries/public-certificate.ts` exports `getPublicCertificate(token)`:

- It returns a **public DTO** with display fields only. There are no internal IDs, no `issuedBy`, and no pilot email or phone.
- It validates the token format first (`^[A-Za-z0-9_-]{22}$`) and returns `null` without querying the database if the format is wrong.
- It is wrapped in React `cache()`, so the page, its metadata and the OG image share one database call per request.

### 5.2 Page

`app/(public)/c/[token]/page.tsx`

- Rendered dynamically on every request, so the status is always current.
- An unknown token calls `notFound()`. The not-found page says: "This certificate link is invalid or no longer available."
- `generateMetadata` sets the title to `{Name} — Certified Agricultural Drone Pilot | CAFT`.
- Set `robots: { index: false }` so search engines don't index pilot pages.

### 5.3 Mobile-first layout

```
┌─────────────────────────┐
│ ✓ VERIFIED · Valid       │  ← status banner (green / amber expired / red revoked)
│   until 12 Mar 2027      │
├─────────────────────────┤
│       [CAFT logo]        │
│  Agricultural Drone Pilot│
│  Certificate of Competency│
│                          │
│    KAMAL PERERA          │  ← name is the hero (h1)
│  [ COMPETENT / PASS ]    │
├────────────┬────────────┤
│ Cert No.   │ Employee ID│  ← 2-col tiles on mobile,
│ ADP-2026-01│ EMP-0042   │     up to 5–6 per row on desktop
│ Issued     │ Valid until│
│ Flying hrs │            │
├─────────────────────────┤
│ Authorized models        │
│ (DJI Agras T25)(T20P)    │  ← chips
├─────────────────────────┤
│ Assessed competencies    │
│ ✓ Pre/Post-flight insp.  │  ← 1 col mobile, 2 col desktop
│ ✓ ...                    │
├─────────────────────────┤
│ Signed by                │
│ Training Manager: ...    │
│ Authorized Signatory: ...│
├─────────────────────────┤
│ [QR]  Scan to verify     │
│ disclaimer (small text)  │
├─────────────────────────┤
│ [⬇ Download PDF] [Share] │  ← sticky bottom bar on mobile
└─────────────────────────┘
```

### 5.4 Components

- **`StatusBanner`** — the colour is paired with an icon and text, so the status never depends on colour alone.
- **Fact grid** — `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`.
- **Competency list** — `grid-cols-1 md:grid-cols-2`.
- **`ActionBar`** — Download PDF, Share and Copy link.
  - On mobile it is a fixed bottom bar with safe-area padding.
  - From `md:` up it sits inline under the header.
  - Share uses `navigator.share` when the browser supports it, and falls back to copying the link with a toast.
- **`CertificatePreview`** — a dialog showing the landscape design at a fixed 1123×794 px, scaled with a CSS transform to fit the screen width.
- **Desktop** — a centred `max-w-3xl` container with a subtle CAFT-green top accent.

### 5.5 Accessibility

- Semantic headings, with the pilot's name as the `h1`.
- `role="status"` on the status banner.
- Visible focus rings.
- Tap targets of at least 44px.
- Colour contrast meets WCAG AA.
- The page is readable without JavaScript; only Share and Copy need it.

**Done when:**
- The page looks right at 360px, 768px and 1280px wide.
- All four states render correctly.
- An invalid token shows the not-found page.

---

## Phase 6 — PDF and QR Generation

### 6.1 QR route

`/api/c/[token]/qr`

- Encodes `${NEXT_PUBLIC_APP_URL}/c/${token}` with the `qrcode` package, at error-correction level M, as a PNG of about 512px.
- `?download=1` adds `Content-Disposition` with the filename `QR_ADP-2026-001.png`.
- Sends `Cache-Control: public, max-age=86400`, since a token's URL never changes.
- Returns 404 for an unknown token.

### 6.2 PDF template

`components/certificate/pdf/CertificatePdf.tsx` uses `@react-pdf/renderer` on an A4 landscape page.

- Register fonts from local TTF files in `src/assets/fonts` (e.g. Inter Regular and Bold). Don't depend on fonts from the network.
- Use a PNG logo, because react-pdf's SVG support is limited.

**Layout, top to bottom:**

1. Double border
2. Logo
3. Green title and black subtitle
4. Tagline
5. "This is to certify that"
6. The pilot's name on the name line
7. Body sentence (restored — it was hidden in the original template)
8. 6-column info strip, with consistent label fonts and "**Flying** Hours" spelled correctly
9. Two columns of competencies, plus the result box
10. Three signature blocks, with the QR code at the bottom right next to the stamp block
11. Disclaimer

**Behaviour:**
- Long names shrink to fit on one line.
- Expired and revoked certificates get a diagonal watermark at 15% opacity.

### 6.3 PDF route

`/api/c/[token]/pdf`

- `export const runtime = "nodejs"`.
- Returns 404 for an unknown token.
- Renders the PDF with `renderToBuffer(<CertificatePdf … qrDataUrl={…} />)`.
- Response headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="ADP-2026-001_Kamal-Perera.pdf"` (with the name sanitised)
  - `Cache-Control: private, no-store`, because the status can change
- Logs `pdf.generated` at `info` level, with `certificateNo` and `durationMs`. Logs `pdf.generate.failed` at `error` level.
- If Next.js bundling breaks react-pdf, add it to `serverExternalPackages` in `next.config.ts`:

  ```ts
  const nextConfig = {
    serverExternalPackages: ["@react-pdf/renderer"],
  };
  ```

**Done when:**
- The downloaded PDF is A4 landscape and faithful to the template.
- Its QR code scans to the public page.
- Downloads work on Android Chrome, iOS Safari and desktop.
- An expired certificate's PDF shows the watermark.

---

## Phase 7 — Sharing and Polish

- **OG image:** `opengraph-image.tsx` uses `next/og` to make a 1200×630 card with the CAFT logo, the pilot's name, "Certified Agricultural Drone Pilot" and the status. Test it by pasting a link into WhatsApp.
- **Branding:** a CAFT favicon and app metadata.
- **Empty states:** e.g. "No pilots yet — add your first pilot."
- **Loading states:** skeletons on every admin table and on the public page.
- **Admin conveniences:**
  - a copy-link button in every certificate row,
  - QR download straight from the table,
  - an "Expiring soon" filter chip on the dashboard.
- **Security headers** in `next.config.ts`:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - a `Permissions-Policy` that disables camera, microphone and geolocation

---

## Phase 8 — Testing, Hardening and Deployment

### 8.1 Testing

For a POC, focus on the tests that give the most value.

**Unit tests (Vitest)** — `pnpm test`

- `getCertificateState`, including boundary dates: the `validUntil` day itself, the day after, and 30 days before
- Certificate number formatting
- The zod schemas
- PDF filename sanitisation

**End-to-end tests (Playwright)** — `pnpm test:e2e`

- An admin signs in, creates a pilot, issues a certificate, opens the public link and sees "Valid".
- A PDF download returns 200 with `application/pdf`.
- An invalid token returns 404.
- After a certificate is revoked, its public page shows "Revoked".

Use Clerk testing tokens with a dedicated test admin user.

### 8.2 Hardening checklist

- [ ] Every admin action and page calls `requireAdmin()`.
- [ ] The public DTO contains no personal data beyond the name and employee ID.
- [ ] Tokens are validated before any database query.
- [ ] Prisma errors are mapped. Unmapped errors become `INTERNAL`, logged at `error` level.
- [ ] The only `NEXT_PUBLIC_` variables are the Clerk publishable key and the app URL.
- [ ] Rate limit the PDF route (e.g. with Upstash Ratelimit). Optional for the POC, but recommended before a public launch.

### 8.3 Deployment (Vercel and Neon)

- **Package manager:** Vercel detects pnpm from `pnpm-lock.yaml`. `"packageManager"` in `package.json` pins the version.
- **Install command:** the default `pnpm install` works. Make sure `onlyBuiltDependencies` includes the Prisma packages, or `prisma generate` will fail in CI.
- **Build command:** `pnpm db:deploy && pnpm build`. The `build` script already runs `prisma generate`.
- **Environments:**
  - Production uses Neon `main`.
  - Preview deployments get a Neon branch each; the Neon–Vercel integration can create these automatically.
- **Environment variables:** set them per environment. `NEXT_PUBLIC_APP_URL` must match each environment's domain, because QR codes contain the full URL.
- **Clerk:** use a production instance with the production domain configured.
- **Smoke test after deploying:**
  1. Sign in.
  2. Issue a test certificate.
  3. Scan its QR code with a real phone.
  4. Download the PDF.
  5. Revoke the test certificate.

---

## Phase 9 (Optional) — Signature and Stamp Images

- **Uploads** through Vercel Blob or UploadThing:
  - PNG or WEBP only, maximum 1 MB
  - transparent backgrounds recommended
- **Data model:**
  - a `Signatory` model with name, title and `signatureUrl`
  - a `CompanySettings` record holding the stamp image URL
- **Issue form:** admins pick signatories from a dropdown instead of typing names.
- **Snapshotting:** each certificate stores the signatory names and image URLs at the time of issue. Later changes don't alter certificates already issued.
- **Rendering:**
  - the web view gets a signatures strip,
  - the PDF places the images over the signature lines.

---

## Suggested Order and Effort

| Phase | Focus | Rough effort |
|---|---|---|
| 0 | Foundation, logger, errors | 0.5 day |
| 1 | Prisma + Neon + seed | 0.5 day |
| 2 | Clerk + admin gate | 0.5 day |
| 3 | Admin shell + pilots | 1 day |
| 4 | Certificate issuance & management | 1.5 days |
| 5 | Public responsive page | 1 day |
| 6 | PDF + QR | 1–1.5 days |
| 7 | Sharing & polish | 0.5 day |
| 8 | Tests, hardening, deploy | 1 day |
| 9 | Signature & stamp images (optional) | 1 day |

Phases 5 and 6 can run in parallel once Phase 4's data layer exists.

**Main risk:** the PDF template is the riskiest part, because react-pdf's layout engine is stricter than CSS. Prototype it early, even with placeholder data, while working on Phase 3.