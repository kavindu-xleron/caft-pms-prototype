"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type Control,
  Controller,
  type FieldPath,
  useForm,
} from "react-hook-form"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  type PilotFormValues,
  emptyPilotForm,
  pilotSchema,
} from "@/lib/validation/pilot"
import { cn } from "@/lib/utils"
import {
  createPilotAction,
  updatePilotAction,
} from "@/server/actions/pilot-actions"

type Props =
  | { mode: "create" }
  | { mode: "edit"; pilotId: string; defaultValues: PilotFormValues }

export function PilotForm(props: Props) {
  const router = useRouter()
  const form = useForm<PilotFormValues>({
    // raw: submit the untransformed strings; the server re-parses them.
    resolver: zodResolver(pilotSchema, undefined, { raw: true }),
    defaultValues: props.mode === "edit" ? props.defaultValues : emptyPilotForm,
    mode: "onTouched",
  })

  async function onSubmit(values: PilotFormValues) {
    const result =
      props.mode === "create"
        ? await createPilotAction(values)
        : await updatePilotAction({ id: props.pilotId, ...values })

    if (!result.ok) {
      let focused = false
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {}
      )) {
        if (!(field in emptyPilotForm) || !messages[0]) continue
        form.setError(
          field as keyof PilotFormValues,
          { type: "server", message: messages[0] },
          { shouldFocus: !focused }
        )
        focused = true
      }
      toast.error(result.message)
      return
    }

    toast.success(props.mode === "create" ? "Pilot added" : "Pilot updated")
    router.push(`/admin/pilots/${result.data.id}`)
  }

  const { isSubmitting } = form.formState
  const cancelHref =
    props.mode === "edit" ? `/admin/pilots/${props.pilotId}` : "/admin/pilots"

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="max-w-xl"
    >
      <FieldGroup>
        <TextField
          control={form.control}
          name="fullName"
          label="Full name"
          autoComplete="name"
          required
        />
        <TextField
          control={form.control}
          name="employeeId"
          label="Employee ID"
          description="Letters, numbers and dashes, e.g. EMP-0042. Saved in capitals."
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono uppercase"
          required
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          optional
        />
        <TextField
          control={form.control}
          name="phone"
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          description="+94 or 0 followed by 9 digits, e.g. 077 123 4567."
          optional
        />
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pilot-notes">
                Notes{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                {...field}
                id="pilot-notes"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Internal only. Never shown on certificates.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

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
            {props.mode === "create" ? "Add pilot" : "Save changes"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function TextField({
  control,
  name,
  label,
  description,
  optional,
  ...inputProps
}: {
  control: Control<PilotFormValues>
  name: FieldPath<PilotFormValues>
  label: string
  description?: string
  optional?: boolean
} & Omit<React.ComponentProps<typeof Input>, "name">) {
  const id = `pilot-${name}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>
            {label}
            {optional && (
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            )}
          </FieldLabel>
          <Input
            {...inputProps}
            {...field}
            id={id}
            aria-invalid={fieldState.invalid}
            aria-describedby={description ? `${id}-description` : undefined}
            className={cn("h-11 sm:h-9", inputProps.className)}
          />
          {description && (
            <FieldDescription id={`${id}-description`}>
              {description}
            </FieldDescription>
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
