import {
  Document,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"
import {
  CERT_BODY,
  CERT_DISCLAIMER,
  CERT_SUBTITLE,
  CERT_TAGLINE,
  CERT_TITLE,
} from "@/components/certificate/constants"
import {
  infoFontSize,
  nameFontSize,
  twoColumns,
} from "@/components/certificate/layout"
import {
  PDF_COLORS as C,
  PDF_FONT_FAMILY,
  pt,
} from "@/components/certificate/pdf/theme"
import type { CredentialData } from "@/components/certificate/types"
import { formatDate } from "@/lib/format"
import { RESULT_LABELS } from "@/lib/validation/certificate"

export type CertificatePdfProps = {
  data: CredentialData & { certificateNo: string }
  qrDataUrl: string
  /** Absolute path (or data URL) of the CAFT logo PNG. */
  logoSrc: string
  watermark?: "EXPIRED" | "REVOKED"
}

/**
 * The formal A4 landscape certificate. Same layout as the web
 * <CertificateSheet>, with its px sizes converted to pt.
 */
export function CertificatePdf({
  data,
  qrDataUrl,
  logoSrc,
  watermark,
}: CertificatePdfProps) {
  const [left, right] = twoColumns(data.competencies)
  const info: [string, string][] = [
    ["Certificate No.", data.certificateNo],
    ["Employee ID", data.employeeId],
    ["Date of Issue", formatDate(data.issueDate)],
    ["Valid Until", formatDate(data.validUntil)],
    ["Flying Hours", data.flyingHours],
    ["Authorized Models", data.authorizedModels.join(", ")],
  ]

  return (
    <Document
      title={`${data.certificateNo} — ${data.pilotName}`}
      author="CAFT — Ceylon Agro Food Tech"
      subject={`${CERT_TITLE} ${CERT_SUBTITLE}`}
      creator="CAFT Pilot Certificates"
      producer="CAFT Pilot Certificates"
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.outerBorder}>
          <View style={s.innerBorder}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            <Image src={logoSrc} style={s.logo} />

            <Text style={s.title}>{CERT_TITLE.toUpperCase()}</Text>
            <Text style={s.subtitle}>{CERT_SUBTITLE.toUpperCase()}</Text>
            <Text style={s.tagline}>{CERT_TAGLINE}</Text>

            <Text style={s.certify}>This is to certify that</Text>
            <View style={s.nameLine}>
              <Text
                style={[s.name, { fontSize: pt(nameFontSize(data.pilotName)) }]}
              >
                {data.pilotName.toUpperCase()}
              </Text>
            </View>
            <Text style={s.body}>{CERT_BODY}</Text>

            <View style={s.infoStrip}>
              {info.map(([label, value], i) => (
                <View
                  key={label}
                  style={[s.infoCell, i > 0 ? s.infoCellDivider : {}]}
                >
                  <Text style={s.infoLabel}>{label.toUpperCase()}</Text>
                  <Text
                    style={[s.infoValue, { fontSize: pt(infoFontSize(value)) }]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={s.competencyRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionLabel}>ASSESSED COMPETENCIES</Text>
                <View style={s.competencyColumns}>
                  {[left, right].map((column, i) => (
                    <View key={i} style={s.competencyColumn}>
                      {column.map((c) => (
                        <View key={c} style={s.competencyItem}>
                          <Check />
                          <Text style={s.competencyText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
              <View style={s.resultBox}>
                <Text style={s.resultLabel}>RESULT</Text>
                <Text style={s.resultValue}>
                  {RESULT_LABELS[data.result].toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={s.signatureRow}>
              <SignatureBlock
                name={data.trainingManager}
                role="Training Manager"
              />
              <SignatureBlock
                name={data.authorizedSignatory}
                role="Authorized Signatory"
              />
              <View style={s.signatureBlock}>
                <View style={s.stamp} />
                <Text style={s.signatureRole}>Company Stamp</Text>
              </View>
              <View style={s.qrBlock}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
                <Image src={qrDataUrl} style={s.qr} />
                <Text style={s.qrCaption}>Scan to verify</Text>
              </View>
            </View>

            <Text style={s.disclaimer}>{CERT_DISCLAIMER}</Text>
          </View>
        </View>

        {watermark && (
          <View style={s.watermarkLayer} fixed>
            <Text style={s.watermark}>{watermark}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

function SignatureBlock({ name, role }: { name: string; role: string }) {
  return (
    <View style={s.signatureBlock}>
      <Text style={s.signatureName}>{name}</Text>
      <Text style={s.signatureRole}>{role}</Text>
    </View>
  )
}

/** Drawn tick: independent of which glyphs the font happens to include. */
function Check() {
  return (
    <Svg viewBox="0 0 24 24" style={s.check}>
      <Path
        d="M4 12.5l5 5L20 6.5"
        stroke={C.green}
        strokeWidth={3.2}
        fill="none"
      />
    </Svg>
  )
}

const s = StyleSheet.create({
  page: {
    padding: pt(18),
    fontFamily: PDF_FONT_FAMILY,
    color: C.text,
    backgroundColor: C.paper,
  },
  outerBorder: {
    flex: 1,
    borderWidth: pt(3),
    borderColor: C.green,
    padding: pt(5),
  },
  innerBorder: {
    flex: 1,
    borderWidth: pt(1),
    borderColor: C.navy,
    paddingHorizontal: pt(48),
    paddingTop: pt(22),
    paddingBottom: pt(14),
    alignItems: "center",
    textAlign: "center",
  },
  logo: { height: pt(68), objectFit: "contain" },
  title: {
    fontSize: pt(28),
    fontWeight: 700,
    color: C.green,
    letterSpacing: 0.6,
    marginTop: pt(6),
  },
  subtitle: {
    fontSize: pt(16),
    fontWeight: 600,
    letterSpacing: pt(3.2),
    marginTop: 1,
  },
  tagline: { fontSize: pt(10.5), color: C.muted, marginTop: pt(2) },
  certify: {
    fontSize: pt(12),
    fontStyle: "italic",
    color: C.muted,
    marginTop: pt(12),
  },
  // react-pdf ignores textAlign on a Text with minWidth, so the underline
  // lives on a wrapping View that centres the name.
  nameLine: {
    minWidth: "60%",
    maxWidth: "100%",
    alignItems: "center",
    marginTop: pt(2),
    paddingHorizontal: pt(24),
    paddingBottom: pt(2),
    borderBottomWidth: pt(1),
    borderBottomColor: C.rule,
  },
  name: { fontWeight: 700, color: C.navy, textAlign: "center" },
  body: {
    fontSize: pt(11.5),
    color: C.body,
    lineHeight: 1.35,
    marginTop: pt(8),
    maxWidth: pt(880),
  },
  infoStrip: {
    flexDirection: "row",
    width: "100%",
    marginTop: pt(16),
    borderWidth: pt(1),
    borderColor: C.border,
    borderRadius: pt(4),
  },
  infoCell: { flex: 1, paddingHorizontal: pt(8), paddingVertical: pt(8) },
  infoCellDivider: { borderLeftWidth: pt(1), borderLeftColor: C.border },
  infoLabel: {
    fontSize: pt(8.5),
    fontWeight: 600,
    color: C.green,
    letterSpacing: 0.3,
  },
  infoValue: { fontWeight: 600, marginTop: pt(3), lineHeight: 1.2 },
  competencyRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: pt(18),
    gap: pt(24),
    textAlign: "left",
  },
  sectionLabel: {
    fontSize: pt(10),
    fontWeight: 600,
    color: C.green,
    letterSpacing: 0.3,
    marginBottom: pt(6),
  },
  competencyColumns: { flexDirection: "row", gap: pt(20) },
  competencyColumn: { flex: 1, gap: pt(5) },
  competencyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: pt(6),
  },
  competencyText: { fontSize: pt(12.5), lineHeight: 1.3, flex: 1 },
  check: { width: pt(12), height: pt(12), marginTop: pt(2) },
  resultBox: {
    width: pt(190),
    alignSelf: "flex-start",
    alignItems: "center",
    borderWidth: pt(2),
    borderColor: C.green,
    borderRadius: pt(4),
    padding: pt(8),
  },
  resultLabel: {
    fontSize: pt(9),
    fontWeight: 600,
    color: C.muted,
    letterSpacing: 0.3,
  },
  resultValue: {
    fontSize: pt(17),
    fontWeight: 700,
    color: C.green,
    marginTop: pt(4),
    textAlign: "center",
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    marginTop: "auto",
    gap: pt(28),
  },
  signatureBlock: { flex: 1, alignItems: "center" },
  signatureName: { fontSize: pt(12), fontWeight: 600 },
  signatureRole: {
    fontSize: pt(9.5),
    color: C.muted,
    width: "100%",
    textAlign: "center",
    marginTop: pt(4),
    paddingTop: pt(3),
    borderTopWidth: pt(1),
    borderTopColor: C.rule,
  },
  stamp: {
    width: pt(64),
    height: pt(64),
    borderRadius: pt(32),
    borderWidth: pt(1),
    borderStyle: "dashed",
    borderColor: C.rule,
  },
  qrBlock: { alignItems: "center" },
  qr: { width: pt(84), height: pt(84) },
  qrCaption: { fontSize: pt(8), color: C.muted },
  disclaimer: {
    fontSize: pt(8.5),
    color: C.faint,
    marginTop: pt(8),
    lineHeight: 1.3,
  },
  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermark: {
    fontSize: pt(150),
    fontWeight: 900,
    color: C.watermark,
    opacity: 0.15,
    letterSpacing: pt(10),
    transform: "rotate(-28deg)",
  },
})
