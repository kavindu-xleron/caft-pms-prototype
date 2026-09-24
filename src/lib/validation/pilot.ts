import { z } from "zod"

const emptyToNull = (v: string) => (v === "" ? null : v)

export const EMPLOYEE_ID_PATTERN = /^[A-Z0-9-]{2,20}$/
/** Sri Lankan numbers: +94 or 0, followed by 9 digits. */
export const SL_PHONE_PATTERN = /^(?:\+94|0)\d{9}$/

export const pilotSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  employeeId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      EMPLOYEE_ID_PATTERN,
      "Use 2–20 letters, numbers or dashes (e.g. EMP-0042)"
    ),
  email: z
    .string()
    .trim()
    .transform(emptyToNull)
    .pipe(z.email("Enter a valid email address").max(254).nullable()),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .transform(emptyToNull)
    .pipe(
      z
        .string()
        .regex(SL_PHONE_PATTERN, "Use +94 or 0 followed by 9 digits")
        .nullable()
    ),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be at most 1000 characters")
    .transform(emptyToNull),
})

/** Raw form values (all strings). */
export type PilotFormValues = z.input<typeof pilotSchema>
/** Normalised values the service stores. */
export type PilotInput = z.output<typeof pilotSchema>

export const emptyPilotForm: PilotFormValues = {
  fullName: "",
  employeeId: "",
  email: "",
  phone: "",
  notes: "",
}

export const updatePilotSchema = pilotSchema.extend({ id: z.string().min(1) })
export const pilotIdSchema = z.object({ id: z.string().min(1) })

export const PILOT_SORTS = [
  "name",
  "employeeId",
  "certificates",
  "createdAt",
] as const
export type PilotSort = (typeof PILOT_SORTS)[number]
export const PAGE_SIZES = [10, 20, 50] as const

/** URL search params for /admin/pilots; bad values fall back to defaults. */
export const pilotListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(20),
  sort: z.enum(PILOT_SORTS).catch("name"),
  dir: z.enum(["asc", "desc"]).catch("asc"),
})

export type PilotListQuery = z.output<typeof pilotListQuerySchema>
