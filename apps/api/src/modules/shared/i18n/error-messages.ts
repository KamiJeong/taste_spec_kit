import type { I18nService } from "nestjs-i18n";

export function localizeErrorMessage(
  i18n: I18nService<any>,
  code: string,
  locale: string,
  fallback: string
): string {
  return String((i18n as any).translate(`errors.${code}`, {
    lang: locale,
    defaultValue: fallback
  }));
}
