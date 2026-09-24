import type { CertificateListQuery } from "@/lib/validation/certificate"

/** /admin/certificates URL for a query, leaving out default values. */
export function certificateListHref(
  query: CertificateListQuery,
  overrides: Partial<CertificateListQuery> = {}
) {
  const next = { ...query, ...overrides }
  const params = new URLSearchParams()
  if (next.q) params.set("q", next.q)
  if (next.status !== "all") params.set("status", next.status)
  if (next.page !== 1) params.set("page", String(next.page))
  const qs = params.toString()
  return qs ? `/admin/certificates?${qs}` : "/admin/certificates"
}
