const slug = (value: string, pattern: RegExp) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "José" -> "Jose"
    .replace(pattern, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")

/** `ADP-2026-001_Kamal-Perera.pdf`: ASCII only, safe in any header. */
export function pdfFilename(certificateNo: string, pilotName: string): string {
  const cert = slug(certificateNo, /[^A-Za-z0-9-]+/g) || "certificate"
  const name = slug(pilotName, /[^A-Za-z0-9]+/g)
    .slice(0, 60)
    .replace(/-+$/, "")
  return `${cert}${name ? `_${name}` : ""}.pdf`
}

/**
 * `attachment` header with an ASCII fallback plus an RFC 5987 UTF-8 name, so
 * names in Sinhala or Tamil still reach browsers that support `filename*`.
 */
export function pdfContentDisposition(
  certificateNo: string,
  pilotName: string
): string {
  const ascii = pdfFilename(certificateNo, pilotName)
  const unicodeName = pilotName
    .trim()
    .replace(/[\s/\\"]+/g, "-")
    .slice(0, 60)
  const unicode = `${ascii.split("_")[0]!.replace(/\.pdf$/, "")}_${unicodeName}.pdf`
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(unicode)}`
}
