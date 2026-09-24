import { CaftLogo } from "@/components/brand/CaftLogo"
import {
  CERT_BODY,
  CERT_DISCLAIMER,
  CERT_SUBTITLE,
  CERT_TAGLINE,
  CERT_TITLE,
} from "@/components/certificate/constants"
import {
  SHEET_HEIGHT,
  SHEET_WIDTH,
  nameFontSize,
  twoColumns,
} from "@/components/certificate/layout"
import type { CredentialData } from "@/components/certificate/types"
import { formatDate } from "@/lib/format"
import { RESULT_LABELS } from "@/lib/validation/certificate"

/**
 * The formal landscape certificate as HTML, at a fixed 1123×794 px (A4 at
 * 96 dpi). Mirrors the PDF layout; always paper-coloured, even in dark mode.
 */
export function CertificateSheet({
  data,
  qrSrc,
  watermark,
}: {
  data: CredentialData & { certificateNo: string }
  qrSrc: string
  watermark?: "EXPIRED" | "REVOKED"
}) {
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
    <div
      className="relative overflow-hidden bg-white p-[18px] font-sans text-neutral-900"
      style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT }}
    >
      <div className="h-full border-[3px] border-caft-green-print p-[5px]">
        <div className="flex h-full flex-col items-center border border-caft-navy-print px-[48px] pt-[22px] pb-[14px] text-center">
          <CaftLogo plate={false} className="h-[68px]" />

          <p className="mt-[6px] text-[28px] leading-tight font-bold tracking-wide text-caft-green-print uppercase">
            {CERT_TITLE}
          </p>
          <p className="text-[16px] font-semibold tracking-[0.2em] uppercase">
            {CERT_SUBTITLE}
          </p>
          <p className="mt-[2px] text-[10.5px] text-neutral-600">
            {CERT_TAGLINE}
          </p>

          <p className="mt-[12px] text-[12px] text-neutral-600 italic">
            This is to certify that
          </p>
          <p
            className="mt-[2px] min-w-[60%] border-b border-neutral-400 px-[24px] pb-[2px] leading-tight font-bold whitespace-nowrap text-caft-navy-print uppercase"
            style={{ fontSize: nameFontSize(data.pilotName) }}
          >
            {data.pilotName}
          </p>
          <p className="mt-[8px] max-w-[880px] text-[11.5px] leading-snug text-neutral-700">
            {CERT_BODY}
          </p>

          <dl className="mt-[16px] grid w-full grid-cols-6 divide-x divide-neutral-300 rounded-[4px] border border-neutral-300">
            {info.map(([label, value]) => (
              <div key={label} className="px-[8px] py-[8px]">
                <dt className="text-[8.5px] font-semibold tracking-wide text-caft-green-print uppercase">
                  {label}
                </dt>
                <dd className="mt-[3px] text-[12.5px] leading-tight font-semibold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-[18px] flex w-full gap-[24px] text-left">
            <div className="flex-1">
              <p className="mb-[6px] text-[10px] font-semibold tracking-wide text-caft-green-print uppercase">
                Assessed Competencies
              </p>
              <div className="grid grid-cols-2 gap-x-[20px]">
                {[left, right].map((column, i) => (
                  <ul key={i} className="space-y-[5px]">
                    {column.map((c) => (
                      <li
                        key={c}
                        className="flex gap-[6px] text-[12.5px] leading-snug"
                      >
                        <span
                          className="font-bold text-caft-green-print"
                          aria-hidden
                        >
                          ✓
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
            <div className="flex w-[190px] shrink-0 flex-col items-center justify-center self-start rounded-[4px] border-2 border-caft-green-print px-[8px] py-[8px] text-center">
              <p className="text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
                Result
              </p>
              <p className="mt-[4px] text-[17px] leading-tight font-bold text-caft-green-print uppercase">
                {RESULT_LABELS[data.result]}
              </p>
            </div>
          </div>

          <div className="mt-auto flex w-full items-end gap-[28px]">
            <SignatureBlock
              name={data.trainingManager}
              role="Training Manager"
            />
            <SignatureBlock
              name={data.authorizedSignatory}
              role="Authorized Signatory"
            />
            <div className="flex flex-1 flex-col items-center">
              <div
                className="size-[64px] rounded-full border border-dashed border-neutral-400"
                aria-hidden
              />
              <p className="mt-[4px] w-full border-t border-neutral-400 pt-[3px] text-[9.5px] text-neutral-600">
                Company Stamp
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from our own route */}
              <img
                src={qrSrc}
                alt=""
                width={84}
                height={84}
                className="size-[84px]"
              />
              <p className="text-[8px] text-neutral-600">Scan to verify</p>
            </div>
          </div>

          <p className="mt-[8px] text-[8.5px] leading-snug text-neutral-500">
            {CERT_DISCLAIMER}
          </p>
        </div>
      </div>

      {watermark && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span className="-rotate-[28deg] text-[150px] font-black tracking-widest text-red-700 opacity-15">
            {watermark}
          </span>
        </div>
      )}
    </div>
  )
}

function SignatureBlock({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <p className="text-[12px] font-semibold">{name}</p>
      <p className="mt-[4px] w-full border-t border-neutral-400 pt-[3px] text-[9.5px] text-neutral-600">
        {role}
      </p>
    </div>
  )
}
