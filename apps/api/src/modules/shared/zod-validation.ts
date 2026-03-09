import type { ZodType } from "zod";
import { ERROR_CODES } from "@packages/contracts-auth";
import { fail } from "./fail";

export function validateWithZod<T>(
  schema: ZodType<T>,
  input: unknown
): { ok: true; data: T } | { ok: false; response: { status: number; body: ReturnType<typeof fail> } } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      response: {
        status: 400,
        body: fail(ERROR_CODES.VALIDATION_ERROR, parsed.error.flatten())
      }
    };
  }
  return { ok: true, data: parsed.data };
}
