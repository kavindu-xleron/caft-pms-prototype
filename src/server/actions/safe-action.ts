import "server-only"
import { unstable_rethrow } from "next/navigation"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { requireAdmin } from "@/server/auth"
import { AppError } from "@/server/errors"
import { childLogger, type Logger } from "@/server/logger"
import {
  isUniqueViolation,
  uniqueViolationFields,
} from "@/server/prisma-errors"
import { getRequestId } from "@/server/request-id"

export type AdminActionContext = { actorId: string; log: Logger }

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(
    z.flattenError(error).fieldErrors
  )) {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = messages
    }
  }
  return fieldErrors
}

/**
 * Wraps every admin server action: auth, input validation, logging and error
 * mapping. The returned action never throws to the client.
 */
export function adminAction<S extends z.ZodType, R>(
  name: string,
  schema: S,
  handler: (input: z.infer<S>, ctx: AdminActionContext) => Promise<R>
) {
  return async (raw: unknown): Promise<ActionResult<R>> => {
    const log = childLogger({ action: name, requestId: await getRequestId() })
    try {
      const { userId } = await requireAdmin()
      const parsed = schema.safeParse(raw)
      if (!parsed.success) {
        log.warn({ event: `${name}.validation_failed`, actorId: userId })
        return {
          ok: false,
          code: "VALIDATION",
          message: "Please fix the highlighted fields",
          fieldErrors: toFieldErrors(parsed.error),
        }
      }
      const data = await handler(parsed.data, {
        actorId: userId,
        log: log.child({ actorId: userId }),
      })
      return { ok: true, data }
    } catch (err) {
      // Let redirect(), notFound() etc. from the handler reach Next.js.
      unstable_rethrow(err)
      if (err instanceof AppError) {
        log.warn({ event: `${name}.failed`, code: err.code, meta: err.meta })
        return {
          ok: false,
          code: err.code,
          message: err.message,
          ...(err.fieldErrors && { fieldErrors: err.fieldErrors }),
        }
      }
      if (isUniqueViolation(err)) {
        log.warn({
          event: `${name}.conflict`,
          fields: uniqueViolationFields(err),
        })
        return {
          ok: false,
          code: "CONFLICT",
          message: "A record with this value already exists",
        }
      }
      log.error({ event: `${name}.error`, err })
      return {
        ok: false,
        code: "INTERNAL",
        message: "Something went wrong. Please try again.",
      }
    }
  }
}
