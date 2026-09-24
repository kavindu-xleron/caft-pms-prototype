import { describe, expect, it } from "vitest"
import { formatDate } from "@/lib/format"

describe("formatDate", () => {
  it("formats date-only values without timezone shift", () => {
    expect(formatDate(new Date("2027-03-12T00:00:00Z"))).toBe("12 Mar 2027")
    expect(formatDate("2027-03-12")).toBe("12 Mar 2027")
  })
})
