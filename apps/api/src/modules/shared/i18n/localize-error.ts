import type { ApiLocale } from "./locale";
import { localizeErrorMessage } from "./error-messages";
import { localizeSuccessMessage } from "./success-messages";
import type { I18nService } from "nestjs-i18n";

type ApiErrorEnvelope = {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  meta?: unknown;
};

type GraphqlErrorEnvelope = {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ApiSuccessEnvelope = {
  success: true;
  data: Record<string, unknown>;
  meta?: unknown;
};

function localizeApiSuccessEnvelope(
  i18n: I18nService<any>,
  body: ApiSuccessEnvelope,
  locale: ApiLocale
): ApiSuccessEnvelope {
  const data = body.data;
  if (!data || typeof data !== "object") return body;
  if (typeof data.message !== "string") return body;

  const rawCode = typeof data.messageCode === "string" ? data.messageCode : data.message;
  if (!/^[A-Z0-9_]+$/.test(rawCode)) return body;

  return {
    ...body,
    data: {
      ...data,
      message: localizeSuccessMessage(i18n, rawCode, locale, data.message)
    }
  };
}

function localizeApiErrorEnvelope(
  i18n: I18nService<any>,
  body: ApiErrorEnvelope,
  locale: ApiLocale
): ApiErrorEnvelope {
  return {
    ...body,
    message: localizeErrorMessage(i18n, body.code, locale, body.message)
  };
}

function localizeGraphqlErrors(
  i18n: I18nService<any>,
  body: Record<string, unknown>,
  locale: ApiLocale
): Record<string, unknown> {
  const rawErrors = body.errors;
  if (!Array.isArray(rawErrors)) return body;

  const errors = rawErrors.map((error) => {
    if (!error || typeof error !== "object") return error;
    const item = error as GraphqlErrorEnvelope;
    const code = item.extensions?.code;
    if (typeof code !== "string" || typeof item.message !== "string") return error;
    return {
      ...item,
      message: localizeErrorMessage(i18n, code, locale, item.message)
    };
  });

  return {
    ...body,
    errors
  };
}

export function localizeErrorBody(i18n: I18nService<any>, body: unknown, locale: ApiLocale): unknown {
  if (!body || typeof body !== "object") return body;

  const candidate = body as Record<string, unknown>;
  if (candidate.success === true && candidate.data && typeof candidate.data === "object") {
    return localizeApiSuccessEnvelope(i18n, candidate as ApiSuccessEnvelope, locale);
  }
  if (
    candidate.success === false &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  ) {
    return localizeApiErrorEnvelope(i18n, candidate as ApiErrorEnvelope, locale);
  }

  return localizeGraphqlErrors(i18n, candidate, locale);
}
