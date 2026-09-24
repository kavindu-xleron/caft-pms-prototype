import "server-only"

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL"

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string, // safe to show user
    public meta?: Record<string, unknown>,
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = "AppError"
  }
}

export const notFoundError = (what: string) =>
  new AppError("NOT_FOUND", `${what} not found`)
export const conflict = (msg: string) => new AppError("CONFLICT", msg)
export const forbidden = () =>
  new AppError("FORBIDDEN", "You do not have access to this resource")
