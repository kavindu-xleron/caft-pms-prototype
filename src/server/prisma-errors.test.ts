import { describe, expect, it } from "vitest"
import { Prisma } from "@/generated/prisma/client"
import {
  isUniqueViolation,
  uniqueViolationFields,
} from "@/server/prisma-errors"

const known = (code: string, meta: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError("x", {
    code,
    clientVersion: "7",
    meta,
  })

describe("uniqueViolationFields", () => {
  it("reads the Neon driver adapter shape", () => {
    const err = known("P2002", {
      modelName: "Pilot",
      driverAdapterError: {
        name: "DriverAdapterError",
        cause: {
          kind: "UniqueConstraintViolation",
          constraint: { fields: ['"employeeId"'] },
        },
      },
    })
    expect(isUniqueViolation(err)).toBe(true)
    expect(uniqueViolationFields(err)).toEqual(["employeeId"])
  })

  it("reads the classic meta.target shape", () => {
    expect(
      uniqueViolationFields(known("P2002", { target: ["certificateNo"] }))
    ).toEqual(["certificateNo"])
  })

  it("returns nothing for unknown shapes", () => {
    expect(uniqueViolationFields(known("P2002", {}))).toEqual([])
    expect(isUniqueViolation(known("P2003", {}))).toBe(false)
  })
})
