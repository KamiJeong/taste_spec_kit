import assert from "node:assert/strict";
import { localizeErrorBody } from "../../src/modules/shared/i18n/localize-error";
import { resolveLocaleFromAcceptLanguage } from "../../src/modules/shared/i18n/locale";

const i18nStub = {
  translate(key: string, options?: { lang?: string; defaultValue?: string }) {
    const messages: Record<string, { en: string; ko: string }> = {
      "errors.AUTH_SESSION_REQUIRED": {
        en: "Authentication is required",
        ko: "인증이 필요합니다"
      },
      "success.AUTH_PASSWORD_RESET_LINK_SENT": {
        en: "Password reset link has been sent",
        ko: "비밀번호 재설정 링크를 이메일로 발송했습니다"
      }
    };
    const entry = messages[key];
    if (!entry) return options?.defaultValue ?? key;
    return options?.lang === "ko" ? entry.ko : entry.en;
  }
};

const localeEn = resolveLocaleFromAcceptLanguage("en-US,en;q=0.9,ko;q=0.8");
assert.equal(localeEn, "en");

const localeEnFallback = resolveLocaleFromAcceptLanguage("fr-FR,ja;q=0.9");
assert.equal(localeEnFallback, "en");

const restError = {
  success: false as const,
  code: "AUTH_SESSION_REQUIRED",
  message: "인증이 필요합니다",
  details: null,
  meta: { serverTime: new Date().toISOString() }
};

const restLocalized = localizeErrorBody(i18nStub as any, restError, "en") as typeof restError;
assert.equal(restLocalized.message, "Authentication is required");
assert.equal(restLocalized.code, "AUTH_SESSION_REQUIRED");

const graphqlErrorBody = {
  errors: [
    {
      message: "인증이 필요합니다",
      extensions: { code: "AUTH_SESSION_REQUIRED", httpStatus: 401 }
    }
  ],
  data: null
};

const graphqlLocalized = localizeErrorBody(i18nStub as any, graphqlErrorBody, "en") as {
  errors: Array<{ message: string; extensions: { code: string } }>;
};
assert.equal(graphqlLocalized.errors[0]?.message, "Authentication is required");
assert.equal(graphqlLocalized.errors[0]?.extensions.code, "AUTH_SESSION_REQUIRED");

const restSuccess = {
  success: true as const,
  data: {
    message: "AUTH_PASSWORD_RESET_LINK_SENT"
  },
  meta: {}
};
const restSuccessLocalized = localizeErrorBody(i18nStub as any, restSuccess, "en") as {
  success: true;
  data: { message: string };
};
assert.equal(restSuccessLocalized.data.message, "Password reset link has been sent");

console.log("unit: i18n error localization ok");
