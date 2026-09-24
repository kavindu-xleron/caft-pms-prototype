import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { PDF_COLORS as C } from "@/components/certificate/pdf/theme"
import { getPublicCertificate } from "@/server/queries/public-certificate"

export const alt = "CAFT certified agricultural drone pilot"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Local fonts, read once (bundled via outputFileTracingIncludes).
const fontDir = join(process.cwd(), "src/assets/fonts")
const fonts = Promise.all([
  readFile(join(fontDir, "Geist-Medium.ttf")),
  readFile(join(fontDir, "Geist-Bold.ttf")),
  readFile(join(fontDir, "Geist-Black.ttf")),
])

const STATUS = {
  VALID: { label: "VERIFIED · VALID", bg: C.green, fg: "#ffffff" },
  EXPIRED: { label: "EXPIRED", bg: C.warning, fg: C.warningText },
  REVOKED: { label: "REVOKED", bg: C.danger, fg: "#ffffff" },
} as const

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [medium, bold, black] = await fonts
  const cert = await getPublicCertificate((await params).token)
  const name = cert?.credential.pilotName ?? "CAFT Certificate"
  const status = cert ? STATUS[cert.state] : null
  const nameSize = name.length > 34 ? 56 : name.length > 24 ? 68 : 80

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.paper,
        borderTop: `18px solid ${C.green}`,
        padding: "56px 72px",
        fontFamily: "Geist",
        color: C.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: C.green,
            letterSpacing: -2,
          }}
        >
          CAFT
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: C.navy,
            letterSpacing: 5,
          }}
        >
          CEYLON AGRO FOOD TECH
        </span>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}
      >
        <span style={{ fontSize: 30, fontWeight: 500, color: C.muted }}>
          Certified Agricultural Drone Pilot
        </span>
        <span
          style={{
            fontSize: nameSize,
            fontWeight: 700,
            color: C.navy,
            textTransform: "uppercase",
            lineHeight: 1.05,
            marginTop: 10,
          }}
        >
          {name}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 40,
        }}
      >
        {status && (
          <span
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              background: status.bg,
              color: status.fg,
              padding: "12px 28px",
              borderRadius: 999,
              alignItems: "center",
              gap: 12,
            }}
          >
            {cert?.state === "VALID" && (
              // Drawn tick: Geist has no ✓ glyph, and next/og would fetch a
              // fallback font from the network.
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path
                  d="M4 12.5l5 5L20 6.5"
                  stroke={status.fg}
                  strokeWidth="3.4"
                  fill="none"
                />
              </svg>
            )}
            {status.label}
          </span>
        )}
        {cert && (
          <span style={{ fontSize: 30, fontWeight: 500, color: C.muted }}>
            {cert.credential.certificateNo}
          </span>
        )}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: medium, weight: 500, style: "normal" },
        { name: "Geist", data: bold, weight: 700, style: "normal" },
        { name: "Geist", data: black, weight: 900, style: "normal" },
      ],
      // Status can change: let previews refresh rather than cache forever.
      headers: { "Cache-Control": "public, max-age=3600" },
    }
  )
}
