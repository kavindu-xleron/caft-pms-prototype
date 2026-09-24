import { describe, expect, it } from "vitest"
import { COMPETENCIES } from "@/components/certificate/constants"
import {
  certificateListQuerySchema,
  issueCertificateSchema,
  revokeCertificateSchema,
} from "@/lib/validation/certificate"

const valid = {
  pilotId: "p1",
  issueDate: "2026-09-24",
  validUntil: "2027-09-24",
  flyingHours: "142.5",
  authorizedModels: ["DJI Agras T25"],
  competencies: [...COMPETENCIES],
  result: "COMPETENT",
  trainingManager: "Nuwan Jayasinghe",
  authorizedSignatory: "Dilani Wickramasinghe",
}

const issuesFor = (over: Record<string, unknown>) => {
  const r = issueCertificateSchema.safeParse({ ...valid, ...over })
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."))
}

describe("issueCertificateSchema", () => {
  it("accepts a valid certificate", () => {
    expect(issuesFor({})).toEqual([])
  })

  it.each(["0", "7", "99999", "99999.9", "12.5"])(
    "accepts flying hours %s",
    (h) => {
      expect(issuesFor({ flyingHours: h })).toEqual([])
    }
  )

  it.each(["", "-1", "100000", "12.55", "1e3", "abc", "12."])(
    "rejects flying hours %j",
    (h) => {
      expect(issuesFor({ flyingHours: h })).toEqual(["flyingHours"])
    }
  )

  it("requires validUntil after issueDate", () => {
    expect(issuesFor({ validUntil: "2026-09-24" })).toEqual(["validUntil"])
    expect(issuesFor({ validUntil: "2026-09-01" })).toEqual(["validUntil"])
  })

  it("rejects impossible dates", () => {
    expect(issuesFor({ issueDate: "2026-02-30" })).toContain("issueDate")
  })

  it("requires at least one model and competency", () => {
    expect(issuesFor({ authorizedModels: [], competencies: [] })).toEqual([
      "authorizedModels",
      "competencies",
    ])
  })

  it("de-duplicates labels", () => {
    const out = issueCertificateSchema.parse({
      ...valid,
      authorizedModels: ["DJI Agras T25", "DJI Agras T25"],
    })
    expect(out.authorizedModels).toEqual(["DJI Agras T25"])
  })
})

describe("revokeCertificateSchema", () => {
  it("requires a meaningful reason", () => {
    expect(
      revokeCertificateSchema.safeParse({ id: "c1", reason: "   no " }).success
    ).toBe(false)
    expect(
      revokeCertificateSchema.safeParse({ id: "c1", reason: "Issued in error" })
        .success
    ).toBe(true)
  })
})

describe("certificateListQuerySchema", () => {
  it("falls back to defaults", () => {
    expect(
      certificateListQuerySchema.parse({ status: "bogus", page: "0" })
    ).toEqual({
      q: "",
      status: "all",
      page: 1,
    })
  })
})
