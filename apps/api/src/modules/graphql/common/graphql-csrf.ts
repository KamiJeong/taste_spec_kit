import type { Request } from "express";
import { GraphQLError } from "graphql";
import { ERROR_CODES } from "@packages/contracts-auth";
import { I18nContext } from "nestjs-i18n";
import { cookieOf } from "../../shared/request-cookie";
import { resolveLocaleFromRequest } from "../../shared/i18n/locale";

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
    const locale = resolveLocaleFromRequest(req);
    const i18n = I18nContext.current();
    const message = i18n?.translate(`errors.${ERROR_CODES.AUTH_CSRF_INVALID}`, {
      lang: locale,
      defaultValue: "CSRF validation failed"
    });
    const text = typeof message === "string" ? message : "CSRF validation failed";
    throw new GraphQLError(text, {
      extensions: {
        code: ERROR_CODES.AUTH_CSRF_INVALID,
        httpStatus: 403
      }
    });
  }
}
