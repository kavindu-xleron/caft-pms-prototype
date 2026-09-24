import { ImageResponse } from "next/og"
import { PDF_COLORS as C } from "@/components/certificate/pdf/theme"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** iOS home-screen icon: the same "C" mark as icon.svg, full-bleed. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.green,
      }}
    >
      <svg width="120" height="120" viewBox="0 0 64 64">
        <path
          d="M44.5 22.5A15 15 0 1 0 44.5 41.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    size
  )
}
