import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, locales } from "./config";

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
