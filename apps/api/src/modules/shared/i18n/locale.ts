import type { Request } from "express";

export type ApiLocale = string;

function parseSupportedLocales(): Set<ApiLocale> {
  const raw = process.env.API_I18N_SUPPORTED ?? "en,ko";
  const locales = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (locales.length === 0) return new Set<ApiLocale>(["en", "ko"]);
  return new Set<ApiLocale>(locales);
}

function getDefaultLocale(): ApiLocale {
  const raw = process.env.API_I18N_DEFAULT?.trim().toLowerCase();
  if (!raw) return "en";
  return raw;
}

function normalizeLocaleTag(tag: string | undefined): ApiLocale | null {
  if (!tag) return null;
  const [language] = tag.trim().toLowerCase().split("-", 2);
  if (!language) return null;
  const supportedLocales = parseSupportedLocales();
  const defaultLocale = getDefaultLocale();
  if (supportedLocales.has(language)) return language;
  if (language === defaultLocale) return defaultLocale;
  return null;
}

export function resolveLocaleFromAcceptLanguage(headerValue: string | string[] | undefined): ApiLocale {
  const defaultLocale = getDefaultLocale();
  const raw = Array.isArray(headerValue) ? headerValue.join(",") : headerValue;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return defaultLocale;
  }

  const orderedTags = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tag, ...params] = part.split(";").map((v) => v.trim());
      const qParam = params.find((param) => param.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const item of orderedTags) {
    const locale = normalizeLocaleTag(item.tag);
    if (locale) return locale;
  }

  return defaultLocale;
}

export function resolveLocaleFromRequest(req: Request): ApiLocale {
  return resolveLocaleFromAcceptLanguage(req.headers["accept-language"]);
}
