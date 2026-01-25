export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "NEXT_LOCALE";

const rtlLocales = new Set<Locale>(["ar"]);

export function getDirection(locale: Locale) {
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}
