import "server-only"

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL"

export type FieldErrors = Record<string, string[]>

export class AppError extends Error {
  public fieldErrors?: FieldErrors

  constructor(
    public code: ErrorCode,
    message: string, // safe to show user
    public meta?: Record<string, unknown>,
    options?: { cause?: unknown; fieldErrors?: FieldErrors }
  ) {
    super(message, options)
    this.name = "AppError"
    this.fieldErrors = options?.fieldErrors
  }
}

export const notFoundError = (what: string) =>
  new AppError("NOT_FOUND", `${what} not found`)
export const conflict = (msg: string) => new AppError("CONFLICT", msg)
export const forbidden = () =>
  new AppError("FORBIDDEN", "You do not have access to this resource")

/** A conflict tied to one form field, shown inline next to that input. */
export const fieldConflict = (
  field: string,
  message: string,
  meta?: Record<string, unknown>
) =>
  new AppError("CONFLICT", message, meta, {
    fieldErrors: { [field]: [message] },
  })
