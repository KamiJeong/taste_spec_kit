import type { Request } from "express";
import { GraphQLError } from "graphql";
import { ERROR_CODES } from "@packages/contracts-auth";
import { cookieOf } from "../../shared/request-cookie";

export function ensureCsrfForMutation(req: Request): void {
  const csrfCookie = cookieOf(req, "csrfToken");
  const csrfHeaderRaw = req.headers["x-csrf-token"];
  const csrfHeader = Array.isArray(csrfHeaderRaw) ? csrfHeaderRaw[0] : csrfHeaderRaw;
  const valid =
    typeof csrfCookie === "string" &&
    typeof csrfHeader === "string" &&
    csrfCookie.length > 0 &&
    csrfHeader === csrfCookie;
  if (!valid) {
    throw new GraphQLError("CSRF 검증에 실패했습니다", {
      extensions: {
        code: ERROR_CODES.AUTH_CSRF_INVALID,
        httpStatus: 403
      }
    });
  }
}
