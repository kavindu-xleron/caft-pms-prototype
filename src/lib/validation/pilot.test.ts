import { describe, expect, it } from "vitest"
import {
  emptyPilotForm,
  pilotListQuerySchema,
  pilotSchema,
} from "@/lib/validation/pilot"

const valid = {
  ...emptyPilotForm,
  fullName: "Kamal Perera",
  employeeId: "EMP-0042",
}

describe("pilotSchema", () => {
  it("normalises input", () => {
    const out = pilotSchema.parse({
      fullName: "  Kamal Perera ",
      employeeId: " emp-0042 ",
      email: " ",
      phone: "+94 77 123-4567",
      notes: "",
    })
    expect(out).toEqual({
      fullName: "Kamal Perera",
      employeeId: "EMP-0042",
      email: null,
      phone: "+94771234567",
      notes: null,
    })
  })

  it.each([
    ["fullName", "K"],
    ["fullName", "x".repeat(101)],
    ["employeeId", "E"],
    ["employeeId", "EMP 0042"],
    ["employeeId", "EMP_0042"],
    ["email", "not-an-email"],
    ["phone", "0771234"],
    ["phone", "+9477123456789"],
    ["phone", "94771234567"],
  ])("rejects %s = %j", (field, value) => {
    const result = pilotSchema.safeParse({ ...valid, [field]: value })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual([field])
  })

  it("accepts local and international phone formats", () => {
    expect(pilotSchema.parse({ ...valid, phone: "0712345678" }).phone).toBe(
      "0712345678"
    )
    expect(pilotSchema.parse({ ...valid, phone: "+94712345678" }).phone).toBe(
      "+94712345678"
    )
  })
})

describe("pilotListQuerySchema", () => {
  it("falls back to defaults for missing or bad values", () => {
    expect(
      pilotListQuerySchema.parse({
        page: "-3",
        pageSize: "7",
        sort: "drop table",
        dir: "up",
      })
    ).toEqual({ q: "", page: 1, pageSize: 20, sort: "name", dir: "asc" })
  })

  it("parses valid values", () => {
    expect(
      pilotListQuerySchema.parse({
        q: " kamal ",
        page: "2",
        pageSize: "50",
        sort: "certificates",
        dir: "desc",
      })
    ).toEqual({
      q: "kamal",
      page: 2,
      pageSize: 50,
      sort: "certificates",
      dir: "desc",
    })
  })
})
