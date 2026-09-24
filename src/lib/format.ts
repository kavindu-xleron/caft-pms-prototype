import { formatInTimeZone } from "date-fns-tz"

/**
 * Date-only values (`@db.Date`) are 00:00 UTC, so format them in UTC to
 * avoid the viewer's or server's timezone shifting the day.
 */
export function formatDate(value: Date | string): string {
  const d =
    typeof value === "string"
      ? new Date(`${value.slice(0, 10)}T00:00:00Z`)
      : value
  return formatInTimeZone(d, "UTC", "d MMM yyyy")
}

const numberFormat = new Intl.NumberFormat("en-LK")

export function formatCount(n: number): string {
  return numberFormat.format(n)
}
