import { describe, expect, it } from "vitest"
import {
  addDaysDateOnly,
  addYearsDateOnly,
  parseDateOnly,
  toIsoDate,
  todayDateOnly,
} from "@/lib/date-only"

describe("parseDateOnly", () => {
  it("returns UTC midnight", () => {
    expect(parseDateOnly("2026-03-12").toISOString()).toBe(
      "2026-03-12T00:00:00.000Z"
    )
  })

  it.each(["2026-3-12", "2026-02-30", "12/03/2026", ""])(
    "rejects %j",
    (input) => {
      expect(() => parseDateOnly(input)).toThrow(RangeError)
    }
  )
})

describe("todayDateOnly", () => {
  it("uses the Asia/Colombo calendar day (UTC+5:30)", () => {
    // 20:00 UTC on 12 Mar is already 01:30 on 13 Mar in Colombo.
    const now = new Date("2026-03-12T20:00:00Z")
    expect(toIsoDate(todayDateOnly(now))).toBe("2026-03-13")
  })

  it("stays on the same day before Colombo midnight", () => {
    const now = new Date("2026-03-12T18:00:00Z") // 23:30 in Colombo
    expect(toIsoDate(todayDateOnly(now))).toBe("2026-03-12")
  })
})

describe("date arithmetic", () => {
  it("adds and subtracts days across month ends", () => {
    const d = parseDateOnly("2026-01-31")
    expect(toIsoDate(addDaysDateOnly(d, 1))).toBe("2026-02-01")
    expect(toIsoDate(addDaysDateOnly(d, -31))).toBe("2025-12-31")
  })

  it("adds years", () => {
    expect(toIsoDate(addYearsDateOnly(parseDateOnly("2026-03-12"), 1))).toBe(
      "2027-03-12"
    )
  })

  it("clamps 29 Feb to 28 Feb in a non-leap year", () => {
    expect(toIsoDate(addYearsDateOnly(parseDateOnly("2028-02-29"), 1))).toBe(
      "2029-02-28"
    )
  })
})
