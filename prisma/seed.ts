import "./load-env"
import { randomBytes } from "node:crypto"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"
import { COMPETENCIES, DRONE_MODELS } from "@/components/certificate/constants"
import {
  type CertStatus,
  PrismaClient,
  type Result,
} from "@/generated/prisma/client"
import {
  addDaysDateOnly,
  addYearsDateOnly,
  toIsoDate,
  todayDateOnly,
} from "@/lib/date-only"

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV is production.")
  process.exit(1)
}
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set. Check .env.local.")
  process.exit(1)
}

neonConfig.webSocketConstructor = ws
const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
  // Prisma's 2s default maxWait is shorter than a Neon cold start.
  transactionOptions: { maxWait: 10_000, timeout: 15_000 },
})

const SEED_ACTOR = "seed"
const TRAINING_MANAGER = "Nuwan Jayasinghe"
const AUTHORIZED_SIGNATORY = "Dilani Wickramasinghe"

const pilots = [
  {
    key: "kamal",
    fullName: "Kamal Perera",
    employeeId: "EMP-0042",
    email: "kamal.perera@example.com",
    phone: "+94771234567",
  },
  {
    key: "nimal",
    fullName: "Nimal Fernando",
    employeeId: "EMP-0057",
    email: "nimal.fernando@example.com",
    phone: "0712345678",
  },
  {
    key: "sanduni",
    fullName: "Sanduni Rathnayake",
    employeeId: "EMP-0063",
    email: null,
    phone: "+94759876543",
  },
  {
    key: "tharindu",
    fullName: "Tharindu Wijesekara Mudiyanselage",
    employeeId: "EMP-0071",
    email: "tharindu.w@example.com",
    phone: null,
  },
  {
    // No certificates: exercises empty states.
    key: "ayesha",
    fullName: "Ayesha Silva",
    employeeId: "EMP-0088",
    email: null,
    phone: null,
  },
] as const

type PilotKey = (typeof pilots)[number]["key"]

type SeedCertificate = {
  label: string
  pilot: PilotKey
  issueDate: Date
  validUntil: Date
  flyingHours: string
  authorizedModels: string[]
  competencies: string[]
  result?: Result
  status?: CertStatus
  revokedReason?: string
}

const today = todayDateOnly()
const daysFromToday = (n: number) => addDaysDateOnly(today, n)
const oneYearFrom = (d: Date) => addYearsDateOnly(d, 1)

const allCompetencies = [...COMPETENCIES]
const allModels = [...DRONE_MODELS]

// One certificate per UI state: valid, expiring soon, expired and revoked.
// Tharindu has an expired certificate and its valid renewal.
const certificates: SeedCertificate[] = [
  {
    label: "valid",
    pilot: "kamal",
    issueDate: daysFromToday(-60),
    validUntil: oneYearFrom(daysFromToday(-60)),
    flyingHours: "142.5",
    authorizedModels: allModels,
    competencies: allCompetencies,
  },
  {
    label: "expiring soon (14 days)",
    pilot: "nimal",
    issueDate: addYearsDateOnly(daysFromToday(14), -1),
    validUntil: daysFromToday(14),
    flyingHours: "88.0",
    authorizedModels: ["DJI Agras T20P"],
    competencies: allCompetencies,
  },
  {
    label: "expired",
    pilot: "tharindu",
    issueDate: addYearsDateOnly(daysFromToday(-20), -1),
    validUntil: daysFromToday(-20),
    flyingHours: "63.5",
    authorizedModels: ["DJI Agras T20P"],
    competencies: allCompetencies.slice(0, 8),
  },
  {
    label: "valid (renewal)",
    pilot: "tharindu",
    issueDate: daysFromToday(-10),
    validUntil: oneYearFrom(daysFromToday(-10)),
    flyingHours: "121.0",
    authorizedModels: allModels,
    competencies: allCompetencies,
  },
  {
    label: "revoked",
    pilot: "sanduni",
    issueDate: daysFromToday(-120),
    validUntil: oneYearFrom(daysFromToday(-120)),
    flyingHours: "35.0",
    authorizedModels: ["DJI Agras T25"],
    competencies: allCompetencies,
    status: "REVOKED",
    revokedReason: "Issued in error: assessment was not completed.",
  },
]

const newToken = () => randomBytes(16).toString("base64url")

async function main() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  await db.$transaction([
    db.auditLog.deleteMany(),
    db.certificate.deleteMany(),
    db.certificateSequence.deleteMany(),
    db.pilot.deleteMany(),
  ])

  const pilotIds = new Map<PilotKey, string>()
  for (const { key, ...data } of pilots) {
    const pilot = await db.pilot.create({ data })
    pilotIds.set(key, pilot.id)
    await db.auditLog.create({
      data: {
        actorId: SEED_ACTOR,
        action: "pilot.created",
        entityType: "Pilot",
        entityId: pilot.id,
      },
    })
  }

  // Number certificates in issue order within each issue year, the same
  // scheme the issuing service uses.
  const lastNoByYear = new Map<number, number>()
  const ordered = [...certificates].sort(
    (a, b) => a.issueDate.getTime() - b.issueDate.getTime()
  )

  const rows: { label: string; no: string; pilot: string; url: string }[] = []
  for (const c of ordered) {
    const year = c.issueDate.getUTCFullYear()
    const seq = (lastNoByYear.get(year) ?? 0) + 1
    lastNoByYear.set(year, seq)
    const certificateNo = `ADP-${year}-${String(seq).padStart(3, "0")}`
    const publicToken = newToken()
    const revoked = c.status === "REVOKED"

    const cert = await db.certificate.create({
      data: {
        certificateNo,
        publicToken,
        pilotId: pilotIds.get(c.pilot)!,
        issueDate: c.issueDate,
        validUntil: c.validUntil,
        flyingHours: c.flyingHours,
        authorizedModels: c.authorizedModels,
        competencies: c.competencies,
        result: c.result ?? "COMPETENT",
        trainingManager: TRAINING_MANAGER,
        authorizedSignatory: AUTHORIZED_SIGNATORY,
        status: c.status ?? "ACTIVE",
        revokedAt: revoked ? new Date() : null,
        revokedReason: revoked ? (c.revokedReason ?? null) : null,
        issuedBy: SEED_ACTOR,
      },
    })

    await db.auditLog.create({
      data: {
        actorId: SEED_ACTOR,
        action: "certificate.issued",
        entityType: "Certificate",
        entityId: cert.id,
        diff: { certificateNo },
      },
    })
    if (revoked) {
      await db.auditLog.create({
        data: {
          actorId: SEED_ACTOR,
          action: "certificate.revoked",
          entityType: "Certificate",
          entityId: cert.id,
          diff: { reason: c.revokedReason ?? null },
        },
      })
    }

    rows.push({
      label: c.label,
      no: certificateNo,
      pilot: pilots.find((p) => p.key === c.pilot)!.fullName,
      url: `${appUrl}/c/${publicToken}`,
    })
  }

  await db.certificateSequence.createMany({
    data: [...lastNoByYear].map(([year, lastNo]) => ({ year, lastNo })),
  })

  console.log(
    `Seeded ${pilots.length} pilots and ${rows.length} certificates (today in Colombo: ${toIsoDate(today)}).`
  )
  console.table(rows)
}

main()
  .catch((err: unknown) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
