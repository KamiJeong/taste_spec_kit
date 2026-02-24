import {
  ApiErrorEnvelopeSchema,
  ApiSuccessEnvelopeSchema,
  ERROR_CODES
} from "@packages/contracts-auth";

// Gate 2 contract freeze: keep runtime-accessible contract references in one place.
export const contractRuntime = {
  envelopes: {
    success: ApiSuccessEnvelopeSchema,
    error: ApiErrorEnvelopeSchema
  },
  errorCodes: ERROR_CODES
};
