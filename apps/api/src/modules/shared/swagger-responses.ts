import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { errorEnvelopeSchema, successEnvelopeSchema } from "./swagger-envelopes";

function ApiSuccessResponse(status: number, description: string) {
  return applyDecorators(ApiResponse({ status, description, schema: successEnvelopeSchema }));
}

function ApiErrorResponse(status: number, description: string) {
  return applyDecorators(ApiResponse({ status, description, schema: errorEnvelopeSchema }));
}

export function ApiCreatedValidation(description: string) {
  return applyDecorators(ApiSuccessResponse(201, description), ApiErrorResponse(400, "Validation error"));
}

export function ApiOkValidation(successDescription: string, invalidDescription = "Validation or auth error") {
  return applyDecorators(ApiSuccessResponse(200, successDescription), ApiErrorResponse(400, invalidDescription));
}

export function ApiOkUnauthorized(successDescription: string, unauthorizedDescription = "Unauthorized") {
  return applyDecorators(
    ApiSuccessResponse(200, successDescription),
    ApiErrorResponse(401, unauthorizedDescription),
    ApiErrorResponse(400, "Validation error")
  );
}

export function ApiOkCsrf(successDescription: string) {
  return applyDecorators(
    ApiSuccessResponse(200, successDescription),
    ApiErrorResponse(401, "Unauthorized"),
    ApiErrorResponse(403, "CSRF invalid")
  );
}

export function ApiOkValidationCsrf(successDescription: string) {
  return applyDecorators(
    ApiSuccessResponse(200, successDescription),
    ApiErrorResponse(400, "Validation error"),
    ApiErrorResponse(401, "Unauthorized"),
    ApiErrorResponse(403, "CSRF invalid")
  );
}
