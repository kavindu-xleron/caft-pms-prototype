import type { PilotListQuery } from "@/lib/validation/pilot"

const DEFAULTS: PilotListQuery = {
  q: "",
  page: 1,
  pageSize: 20,
  sort: "name",
  dir: "asc",
}

/** /admin/pilots URL for a query, leaving out default values. */
export function pilotListHref(
  query: PilotListQuery,
  overrides: Partial<PilotListQuery> = {}
) {
  const next = { ...query, ...overrides }
  const params = new URLSearchParams()
  for (const key of Object.keys(DEFAULTS) as (keyof PilotListQuery)[]) {
    if (next[key] !== DEFAULTS[key]) params.set(key, String(next[key]))
  }
  const qs = params.toString()
  return qs ? `/admin/pilots?${qs}` : "/admin/pilots"
}
