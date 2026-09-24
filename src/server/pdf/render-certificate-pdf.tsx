import "server-only"
import path from "node:path"
import { Font, renderToBuffer } from "@react-pdf/renderer"
import QRCode from "qrcode"
import {
  CertificatePdf,
  type CertificatePdfProps,
} from "@/components/certificate/pdf/CertificatePdf"
import { breakLongWord } from "@/components/certificate/layout"
import { PDF_FONT_FAMILY } from "@/components/certificate/pdf/theme"

// Local TTFs only: PDF rendering never depends on the network. The files are
// bundled for this route via outputFileTracingIncludes in next.config.ts.
const FONT_DIR = path.join(process.cwd(), "src/assets/fonts")

let fontsRegistered = false
function registerFonts() {
  if (fontsRegistered) return
  const font = (file: string) => path.join(FONT_DIR, file)
  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: font("Geist-Regular.ttf"), fontWeight: 400 },
      { src: font("Geist-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: font("Geist-Medium.ttf"), fontWeight: 500 },
      { src: font("Geist-SemiBold.ttf"), fontWeight: 600 },
      { src: font("Geist-Bold.ttf"), fontWeight: 700 },
      { src: font("Geist-Black.ttf"), fontWeight: 900 },
    ],
  })
  // Never hyphenate real words; only chunk runs too long to fit their box.
  Font.registerHyphenationCallback((word) => breakLongWord(word))
  fontsRegistered = true
}

export async function renderCertificatePdf({
  publicUrl,
  ...props
}: Omit<CertificatePdfProps, "qrDataUrl"> & {
  publicUrl: string
}): Promise<Buffer> {
  registerFonts()
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
  })
  return renderToBuffer(<CertificatePdf {...props} qrDataUrl={qrDataUrl} />)
}
