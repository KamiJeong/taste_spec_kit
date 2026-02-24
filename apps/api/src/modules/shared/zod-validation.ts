import type { ZodType } from "zod";
import { ERROR_CODES } from "@packages/contracts-auth";
import { failure } from "./http-contract";

export function validateWithZod<T>(
  schema: ZodType<T>,
  input: unknown
): { ok: true; data: T } | { ok: false; response: { status: number; body: ReturnType<typeof failure> } } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      response: {
        status: 400,
        body: failure(ERROR_CODES.VALIDATION_ERROR, "요청 값이 올바르지 않습니다", parsed.error.flatten())
      }
    };
  }
  return { ok: true, data: parsed.data };
}
