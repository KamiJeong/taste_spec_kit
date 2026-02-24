import { z } from "zod";
import { ERROR_CODES } from "./error-codes";

export const ErrorCodeSchema = z.enum(Object.values(ERROR_CODES));

export const ApiMetaSchema = z.object({
  serverTime: z.iso.datetime().optional(),
  cooldownUntil: z.iso.datetime().optional()
});

export const ApiSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: ApiMetaSchema.optional()
});

export const ApiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.unknown().nullable().optional(),
  meta: ApiMetaSchema.optional()
});
