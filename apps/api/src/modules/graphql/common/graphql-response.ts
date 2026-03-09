import { GraphQLError } from "graphql";
import type { Request } from "express";
import { I18nContext } from "nestjs-i18n";
import { resolveLocaleFromAcceptLanguage, resolveLocaleFromRequest } from "../../shared/i18n/locale";

export interface ServiceResponse<T> {
  status: number;
  body:
    | {
        success: true;
        data: T;
      }
    | {
        success: false;
        code: string;
        message: string;
        details: unknown;
      };
}

export function toGraphqlError(response: ServiceResponse<unknown>, req?: Request): GraphQLError {
  if (response.body.success) {
    return new GraphQLError("Unknown GraphQL conversion error");
  }
  const locale = req ? resolveLocaleFromRequest(req) : resolveLocaleFromAcceptLanguage(undefined);
  const i18n = I18nContext.current();
  const translated = i18n?.translate(`errors.${response.body.code}`, {
    lang: locale,
    defaultValue: response.body.message
  });
  const message = typeof translated === "string" ? translated : response.body.message;
  return new GraphQLError(message, {
    extensions: {
      code: response.body.code,
      httpStatus: response.status,
      details: response.body.details,
      localizedMessage: message
    }
  });
}
