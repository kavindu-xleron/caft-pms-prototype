import { formatInTimeZone } from "date-fns-tz"

export const APP_TIME_ZONE = "Asia/Colombo"

/**
 * Calendar dates (`@db.Date` columns) are represented as `Date` objects at
 * 00:00 UTC — the same shape Prisma returns. All arithmetic here is done in
 * UTC so the host machine's timezone never shifts the day.
 */
export function parseDateOnly(isoDate: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new RangeError(`Expected YYYY-MM-DD, got "${isoDate}"`)
  }
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime()) || toIsoDate(d) !== isoDate) {
    throw new RangeError(`Invalid calendar date "${isoDate}"`)
  }
  return d
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Today's calendar date in Asia/Colombo. */
export function todayDateOnly(now: Date = new Date()): Date {
  return parseDateOnly(formatInTimeZone(now, APP_TIME_ZONE, "yyyy-MM-dd"))
}

export function addDaysDateOnly(d: Date, days: number): Date {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + days)
  return r
}

/** Adds whole years; 29 Feb clamps to 28 Feb in non-leap years. */
export function addYearsDateOnly(d: Date, years: number): Date {
  const r = new Date(d)
  r.setUTCDate(1)
  r.setUTCFullYear(r.getUTCFullYear() + years)
  const lastDay = new Date(
    Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)
  ).getUTCDate()
  r.setUTCDate(Math.min(d.getUTCDate(), lastDay))
  return r
}
