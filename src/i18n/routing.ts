import { defaultLocale, isLocale, type Locale } from "./config";

export function getLocaleFromPathname(pathname: string): Locale | null {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  const stripped = pathname.replace(`/${locale}`, "");
  return stripped.length > 0 ? stripped : "/";
}

export function addLocaleToPathname(
  pathname: string,
  locale: Locale | string,
): string {
  // Ensure locale is valid
  const safeLocale: Locale = isLocale(locale) ? locale : defaultLocale;

  if (!pathname.startsWith("/")) return pathname;
  const currentLocale = getLocaleFromPathname(pathname);
  if (currentLocale === safeLocale) return pathname;
  if (currentLocale) {
    return `/${safeLocale}${stripLocaleFromPathname(pathname)}`;
  }
  if (pathname === "/") return `/${safeLocale}`;
  return `/${safeLocale}${pathname}`;
}

export function switchLocale(
  pathname: string,
  locale: Locale,
): string {
  return addLocaleToPathname(stripLocaleFromPathname(pathname), locale);
}

export function normalizeLocale(value?: string | null) {
  return isLocale(value) ? value : defaultLocale;
}

export function isExternalHref(href: string) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

export function isHashHref(href: string) {
  return href.startsWith("#");
}
