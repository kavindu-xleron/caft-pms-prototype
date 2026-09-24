import { describe, expect, it } from "vitest"
import { nameFontSize, twoColumns } from "@/components/certificate/layout"

describe("nameFontSize", () => {
  it("shrinks as names get longer, never below 18px", () => {
    const sizes = [
      "Kamal Perera",
      "Tharindu Wijesekara",
      "Tharindu Wijesekara Mudiyanselage",
      "x".repeat(80),
    ].map(nameFontSize)
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a))
    expect(Math.min(...sizes)).toBe(18)
  })
})

describe("twoColumns", () => {
  it("splits evenly, left column first", () => {
    expect(twoColumns([1, 2, 3, 4, 5])).toEqual([
      [1, 2, 3],
      [4, 5],
    ])
    expect(twoColumns([])).toEqual([[], []])
  })
})
