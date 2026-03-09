import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation } from "@nestjs/swagger";

export function ApiEndpoint(summary: string) {
  return applyDecorators(ApiOperation({ summary }));
}

export function ApiSessionCookieAuth() {
  return applyDecorators(ApiBearerAuth());
}

export function ApiCsrfHeader() {
  return applyDecorators(
    ApiHeader({
      name: "x-csrf-token",
      required: true,
      description: "CSRF token that matches csrfToken cookie"
    })
  );
}

export function ApiSessionMutationAuth() {
  return applyDecorators(ApiSessionCookieAuth(), ApiCsrfHeader());
}
