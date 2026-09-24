import { describe, expect, it } from "vitest"
import {
  breakLongWord,
  infoFontSize,
  nameFontSize,
  twoColumns,
} from "@/components/certificate/layout"

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

describe("infoFontSize", () => {
  it("keeps normal values full size and shrinks long ones", () => {
    expect(infoFontSize("ADP-2026-001")).toBe(12.5)
    expect(infoFontSize("EMP-ABCDEFGHIJKLMNOP")).toBeLessThan(12.5)
  })
})

describe("breakLongWord", () => {
  it("never splits normal words", () => {
    expect(breakLongWord("Wickramasinghe")).toEqual(["Wickramasinghe"])
  })

  it("chunks pathological runs", () => {
    expect(breakLongWord("M".repeat(40))).toEqual([
      "M".repeat(18),
      "M".repeat(18),
      "M".repeat(4),
    ])
  })
})
