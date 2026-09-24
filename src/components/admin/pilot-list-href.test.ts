import { describe, expect, it } from "vitest"
import { pilotListHref } from "@/components/admin/pilot-list-href"

const base = { q: "", page: 1, pageSize: 20, sort: "name", dir: "asc" } as const

describe("pilotListHref", () => {
  it("omits defaults", () => {
    expect(pilotListHref(base)).toBe("/admin/pilots")
  })

  it("keeps non-default values and applies overrides", () => {
    expect(
      pilotListHref(
        { ...base, q: "kamal perera", sort: "certificates" },
        { page: 3 }
      )
    ).toBe("/admin/pilots?q=kamal+perera&page=3&sort=certificates")
  })
})
