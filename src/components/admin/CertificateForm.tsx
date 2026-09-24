"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Eye, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  type Control,
  Controller,
  type FieldPath,
  useForm,
  useWatch,
} from "react-hook-form"
import { toast } from "sonner"
import { CertificateLinkPanel } from "@/components/admin/CertificateLinkPanel"
import { COMPETENCIES, DRONE_MODELS } from "@/components/certificate/constants"
import { CredentialView } from "@/components/certificate/web/CredentialView"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addYearsDateOnly, parseDateOnly, toIsoDate } from "@/lib/date-only"
import { cn } from "@/lib/utils"
import {
  type CertificateResult,
  type IssueCertificateValues,
  RESULT_LABELS,
  RESULTS,
  issueCertificateSchema,
} from "@/lib/validation/certificate"
import {
  issueCertificateAction,
  updateCertificateAction,
} from "@/server/actions/certificate-actions"
import type { PilotOption } from "@/server/queries/certificates"

type FormValues = IssueCertificateValues

type IssuedCertificate = {
  id: string
  certificateNo: string
  publicUrl: string
  qrPath: string
}

type Props =
  | {
      mode: "issue"
      pilots: PilotOption[]
      defaultValues: FormValues
    }
  | {
      mode: "edit"
      certificateId: string
      pilot: PilotOption
      defaultValues: FormValues
    }

export function CertificateForm(props: Props) {
  const router = useRouter()
  const [step, setStep] = useState<"edit" | "review">("edit")
  const [issued, setIssued] = useState<IssuedCertificate | null>(null)

  const form = useForm<FormValues>({
    // raw: submit the untransformed values; the server re-parses them.
    resolver: zodResolver(issueCertificateSchema, undefined, { raw: true }),
    defaultValues: props.defaultValues,
    mode: "onTouched",
  })
  const { isSubmitting } = form.formState

  const pilots = props.mode === "issue" ? props.pilots : [props.pilot]
  const pilotId = useWatch({ control: form.control, name: "pilotId" })
  const selectedPilot = pilots.find((p) => p.id === pilotId)

  function applyServerErrors(
    fieldErrors: Record<string, string[]> | undefined
  ) {
    let focused = false
    for (const [field, messages] of Object.entries(fieldErrors ?? {})) {
      if (!(field in props.defaultValues) || !messages[0]) continue
      form.setError(
        field as FieldPath<FormValues>,
        { type: "server", message: messages[0] },
        { shouldFocus: !focused }
      )
      focused = true
    }
    return focused
  }

  async function onSubmit(values: FormValues) {
    if (props.mode === "edit") {
      const { pilotId: _pilot, ...fields } = values
      const result = await updateCertificateAction({
        id: props.certificateId,
        ...fields,
      })
      if (!result.ok) {
        applyServerErrors(result.fieldErrors)
        toast.error(result.message)
        return
      }
      toast.success(
        result.data.changed.length
          ? "Certificate updated"
          : "No changes to save"
      )
      router.push(`/admin/certificates/${props.certificateId}`)
      return
    }

    const result = await issueCertificateAction(values)
    if (!result.ok) {
      if (applyServerErrors(result.fieldErrors)) setStep("edit")
      toast.error(result.message)
      return
    }
    setIssued(result.data)
  }

  async function review() {
    if (await form.trigger(undefined, { shouldFocus: true })) {
      setStep("review")
      window.scrollTo({ top: 0 })
    }
  }

  function issueAnother() {
    setIssued(null)
    setStep("edit")
    form.reset({ ...props.defaultValues, pilotId: "" })
    router.refresh()
  }

  if (step === "review" && selectedPilot) {
    const v = form.getValues()
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Check the certificate below. The certificate number is assigned when
          you issue it.
        </p>
        <CredentialView
          nameAs="h2"
          data={{
            pilotName: selectedPilot.fullName,
            employeeId: selectedPilot.employeeId,
            certificateNo: null,
            issueDate: v.issueDate,
            validUntil: v.validUntil,
            flyingHours: Number(v.flyingHours).toFixed(1),
            authorizedModels: [...new Set(v.authorizedModels)],
            competencies: [...new Set(v.competencies)],
            result: v.result,
            trainingManager: v.trainingManager.trim(),
            authorizedSignatory: v.authorizedSignatory.trim(),
          }}
        />
        <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t bg-background/95 p-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            variant="outline"
            size="lg"
            className="h-11 sm:h-9"
            onClick={() => setStep("edit")}
            disabled={isSubmitting}
          >
            <ArrowLeft aria-hidden /> Back to edit
          </Button>
          <Button
            size="lg"
            className="h-11 sm:h-9"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle className="animate-spin" aria-hidden />
            )}
            Issue certificate
          </Button>
        </div>
        {issued && (
          <IssuedDialog
            issued={issued}
            pilotName={selectedPilot.fullName}
            onView={() => router.push(`/admin/certificates/${issued.id}`)}
            onIssueAnother={issueAnother}
          />
        )}
      </div>
    )
  }

  const cancelHref =
    props.mode === "edit"
      ? `/admin/certificates/${props.certificateId}`
      : pilotId
        ? `/admin/pilots/${pilotId}`
        : "/admin/certificates"

  return (
    <form
      noValidate
      className="max-w-2xl"
      onSubmit={
        props.mode === "edit"
          ? form.handleSubmit(onSubmit)
          : (e) => (e.preventDefault(), review())
      }
    >
      <FieldGroup>
        {props.mode === "issue" ? (
          <PilotSelect control={form.control} pilots={props.pilots} />
        ) : (
          <Field>
            <FieldLabel>Pilot</FieldLabel>
            <p className="text-sm">
              {props.pilot.fullName}{" "}
              <span className="font-mono text-muted-foreground">
                {props.pilot.employeeId}
              </span>
            </p>
          </Field>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <DateField
            control={form.control}
            name="issueDate"
            label="Issue date"
            onDateChange={(issueDate) => {
              // Keep "valid until" at +1 year unless the admin changed it.
              if (
                props.mode === "issue" &&
                !form.getFieldState("validUntil").isDirty
              ) {
                try {
                  form.setValue(
                    "validUntil",
                    toIsoDate(addYearsDateOnly(parseDateOnly(issueDate), 1))
                  )
                } catch {
                  // Incomplete date while typing: leave validUntil alone.
                }
              }
            }}
          />
          <DateField
            control={form.control}
            name="validUntil"
            label="Valid until"
            description="Valid through the end of this day."
          />
        </div>

        <Controller
          control={form.control}
          name="flyingHours"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
              <FieldLabel htmlFor="cert-flyingHours">Flying hours</FieldLabel>
              <Input
                {...field}
                id="cert-flyingHours"
                inputMode="decimal"
                placeholder="e.g. 120.5"
                aria-invalid={fieldState.invalid}
                className="h-11 tabular-nums sm:h-9"
              />
              <FieldDescription>
                0 to 99,999, one decimal place at most.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <CheckboxGroup
          control={form.control}
          name="authorizedModels"
          legend="Authorized models"
          options={[
            ...new Set([
              ...DRONE_MODELS,
              ...props.defaultValues.authorizedModels,
            ]),
          ]}
        />
        <CheckboxGroup
          control={form.control}
          name="competencies"
          legend="Assessed competencies"
          options={[
            ...new Set([...COMPETENCIES, ...props.defaultValues.competencies]),
          ]}
          columns
          selectAll
        />

        <Controller
          control={form.control}
          name="result"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
              <FieldLabel htmlFor="cert-result">Result</FieldLabel>
              <Select
                items={RESULTS.map((r) => ({
                  value: r,
                  label: RESULT_LABELS[r],
                }))}
                value={field.value}
                onValueChange={(v) =>
                  v && field.onChange(v as CertificateResult)
                }
              >
                <SelectTrigger
                  id="cert-result"
                  className="h-11 w-full sm:h-9"
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESULT_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="trainingManager"
            label="Training manager"
            autoComplete="off"
          />
          <TextField
            control={form.control}
            name="authorizedSignatory"
            label="Authorized signatory"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Link
            href={cancelHref}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "h-11 sm:h-9",
            })}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            size="lg"
            className="h-11 sm:h-9"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle className="animate-spin" aria-hidden />
            )}
            {props.mode === "issue" ? (
              <>
                <Eye aria-hidden /> Review certificate
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function PilotSelect({
  control,
  pilots,
}: {
  control: Control<FormValues>
  pilots: PilotOption[]
}) {
  return (
    <Controller
      control={control}
      name="pilotId"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="cert-pilot">Pilot</FieldLabel>
          <Select
            items={pilots.map((p) => ({
              value: p.id,
              label: `${p.fullName} (${p.employeeId})`,
            }))}
            value={field.value || null}
            onValueChange={(v) => field.onChange(v ?? "")}
          >
            <SelectTrigger
              id="cert-pilot"
              className="h-11 w-full sm:h-9"
              aria-invalid={fieldState.invalid}
              onBlur={field.onBlur}
            >
              <SelectValue placeholder="Choose a pilot" />
            </SelectTrigger>
            <SelectContent>
              {pilots.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName}{" "}
                  <span className="font-mono text-muted-foreground">
                    {p.employeeId}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pilots.length === 0 && (
            <FieldDescription>
              No pilots yet.{" "}
              <Link href="/admin/pilots/new" className="underline">
                Add a pilot
              </Link>{" "}
              first.
            </FieldDescription>
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function DateField({
  control,
  name,
  label,
  description,
  onDateChange,
}: {
  control: Control<FormValues>
  name: "issueDate" | "validUntil"
  label: string
  description?: string
  onDateChange?: (value: string) => void
}) {
  const id = `cert-${name}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            id={id}
            type="date"
            aria-invalid={fieldState.invalid}
            className="h-11 sm:h-9"
            onChange={(e) => {
              field.onChange(e)
              onDateChange?.(e.target.value)
            }}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function TextField({
  control,
  name,
  label,
  ...inputProps
}: {
  control: Control<FormValues>
  name: "trainingManager" | "authorizedSignatory"
  label: string
} & Omit<React.ComponentProps<typeof Input>, "name">) {
  const id = `cert-${name}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...inputProps}
            {...field}
            id={id}
            aria-invalid={fieldState.invalid}
            className="h-11 sm:h-9"
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function CheckboxGroup({
  control,
  name,
  legend,
  options,
  columns,
  selectAll,
}: {
  control: Control<FormValues>
  name: "authorizedModels" | "competencies"
  legend: string
  options: string[]
  columns?: boolean
  selectAll?: boolean
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = new Set(field.value)
        const set = (next: Set<string>) =>
          field.onChange(options.filter((o) => next.has(o)))
        return (
          <FieldSet data-invalid={fieldState.invalid}>
            <div className="flex items-center justify-between gap-2">
              <FieldLegend variant="label">{legend}</FieldLegend>
              {selectAll && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() =>
                    set(
                      selected.size === options.length
                        ? new Set()
                        : new Set(options)
                    )
                  }
                >
                  {selected.size === options.length
                    ? "Clear all"
                    : "Select all"}
                </Button>
              )}
            </div>
            <div
              className={cn(
                "grid gap-1",
                columns && "md:grid-cols-2 md:gap-x-6"
              )}
            >
              {options.map((option, i) => {
                const id = `cert-${name}-${i}`
                return (
                  <Field
                    key={option}
                    orientation="horizontal"
                    className="min-h-11 items-center md:min-h-9"
                  >
                    <Checkbox
                      id={id}
                      checked={selected.has(option)}
                      aria-invalid={fieldState.invalid}
                      onCheckedChange={(checked) => {
                        const next = new Set(selected)
                        if (checked) next.add(option)
                        else next.delete(option)
                        set(next)
                        field.onBlur()
                      }}
                    />
                    <FieldLabel htmlFor={id} className="font-normal">
                      {option}
                    </FieldLabel>
                  </Field>
                )
              })}
            </div>
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        )
      }}
    />
  )
}

function IssuedDialog({
  issued,
  pilotName,
  onView,
  onIssueAnother,
}: {
  issued: IssuedCertificate
  pilotName: string
  onView: () => void
  onIssueAnother: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onView()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Certificate issued</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-medium text-foreground">
              {issued.certificateNo}
            </span>{" "}
            for {pilotName}. Share the link or QR code with the pilot.
          </DialogDescription>
        </DialogHeader>
        <CertificateLinkPanel
          certificateNo={issued.certificateNo}
          publicUrl={issued.publicUrl}
          qrPath={issued.qrPath}
        />
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onIssueAnother}>
            Issue another
          </Button>
          <Button size="lg" onClick={onView}>
            View certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
