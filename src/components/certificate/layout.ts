/** A4 landscape at 96 dpi: the web preview's fixed canvas. */
export const SHEET_WIDTH = 1123
export const SHEET_HEIGHT = 794

/** Font size (px) that keeps a pilot's name on one line of the sheet. */
export function nameFontSize(name: string): number {
  const len = name.length
  if (len <= 22) return 34
  if (len <= 28) return 30
  if (len <= 34) return 26
  if (len <= 42) return 22
  return 18
}

/** Split a list into two columns, left column taking the extra item. */
export function twoColumns<T>(items: T[]): [T[], T[]] {
  const half = Math.ceil(items.length / 2)
  return [items.slice(0, half), items.slice(half)]
}
