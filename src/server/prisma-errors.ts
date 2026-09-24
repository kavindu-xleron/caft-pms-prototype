import "server-only"
import { Prisma } from "@/generated/prisma/client"

type KnownError = Prisma.PrismaClientKnownRequestError

const isKnown = (err: unknown, code: string): err is KnownError =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code

/** Unique constraint violation (P2002). */
export const isUniqueViolation = (err: unknown): err is KnownError =>
  isKnown(err, "P2002")

/** Foreign key / RESTRICT violation (P2003). */
export const isForeignKeyViolation = (err: unknown): err is KnownError =>
  isKnown(err, "P2003")

/**
 * Field names of a unique violation. The classic engine reports
 * `meta.target`; driver adapters (Neon) report quoted names under
 * `meta.driverAdapterError.cause.constraint.fields`.
 */
export function uniqueViolationFields(err: KnownError): string[] {
  const meta = err.meta as Record<string, unknown> | undefined
  const target = meta?.target
  if (Array.isArray(target)) return target.map(String)
  if (typeof target === "string") return [target]

  const adapterError = meta?.driverAdapterError as
    { cause?: { constraint?: { fields?: unknown } } } | undefined
  const fields = adapterError?.cause?.constraint?.fields
  return Array.isArray(fields)
    ? fields.map((f) => String(f).replace(/^"|"$/g, ""))
    : []
}
