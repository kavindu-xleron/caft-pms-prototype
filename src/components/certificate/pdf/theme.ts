/**
 * react-pdf cannot read CSS variables or oklch(), so the print brand colours
 * are repeated here as hex. Keep in step with --caft-*-print in globals.css:
 *   --caft-green-print: oklch(0.53 0.14 148)  -> #1d8139
 *   --caft-navy-print:  oklch(0.29 0.07 262)  -> #172a4e
 */
export const PDF_COLORS = {
  green: "#1d8139",
  navy: "#172a4e",
  text: "#171717",
  body: "#404040",
  muted: "#525252",
  faint: "#737373",
  rule: "#a3a3a3",
  border: "#d4d4d4",
  watermark: "#b91c1c",
  paper: "#ffffff",
} as const

export const PDF_FONT_FAMILY = "Geist"

/** Web sheet sizes are px at 96 dpi; PDF sizes are pt at 72 dpi. */
export const pt = (px: number) => px * 0.75
