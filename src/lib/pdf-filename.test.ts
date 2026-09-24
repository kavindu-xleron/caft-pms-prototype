import { describe, expect, it } from "vitest"
import { pdfContentDisposition, pdfFilename } from "@/lib/pdf-filename"

describe("pdfFilename", () => {
  it("joins certificate number and name", () => {
    expect(pdfFilename("ADP-2026-001", "Kamal Perera")).toBe(
      "ADP-2026-001_Kamal-Perera.pdf"
    )
  })

  it("collapses punctuation and whitespace", () => {
    expect(pdfFilename("ADP-2026-001", "  K. A.  O'Neil-Silva  ")).toBe(
      "ADP-2026-001_K-A-O-Neil-Silva.pdf"
    )
  })

  it("strips accents", () => {
    expect(pdfFilename("ADP-2026-001", "José Müller")).toBe(
      "ADP-2026-001_Jose-Muller.pdf"
    )
  })

  it("falls back to the certificate number for non-Latin names", () => {
    expect(pdfFilename("ADP-2026-001", "කමල් පෙරේරා")).toBe("ADP-2026-001.pdf")
  })

  it("never lets header-breaking characters through", () => {
    const name = pdfFilename(
      'ADP-2026-001"\r\nX-Evil: 1',
      'Bob"; filename="evil.exe'
    )
    expect(name).toMatch(/^[A-Za-z0-9_-]+\.pdf$/)
  })

  it("caps very long names", () => {
    expect(
      pdfFilename("ADP-2026-001", "A".repeat(200)).length
    ).toBeLessThanOrEqual(12 + 1 + 60 + 4)
  })
})

describe("pdfContentDisposition", () => {
  it("includes ASCII and UTF-8 names", () => {
    expect(pdfContentDisposition("ADP-2026-001", "කමල් පෙරේරා")).toBe(
      `attachment; filename="ADP-2026-001.pdf"; filename*=UTF-8''${encodeURIComponent("ADP-2026-001_කමල්-පෙරේරා.pdf")}`
    )
  })

  it("contains no raw quotes or newlines from input", () => {
    const header = pdfContentDisposition(
      "ADP-2026-001",
      'Bob"\r\nSet-Cookie: x'
    )
    expect(header).not.toMatch(/[\r\n]/)
    expect(header.match(/"/g)).toHaveLength(2)
  })
})
