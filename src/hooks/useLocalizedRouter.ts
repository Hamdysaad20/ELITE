"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { addLocaleToPathname, switchLocale } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

export function useLocalizedRouter() {
  const router = useRouter();
  const locale = useLocale();

  return {
    push: (href: string) => router.push(addLocaleToPathname(href, locale)),
    replace: (href: string) => router.replace(addLocaleToPathname(href, locale)),
    back: () => router.back(),
    refresh: () => router.refresh(),
  };
}

export function useLocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  return (nextLocale: Locale) => {
    router.push(switchLocale(pathname, nextLocale));
  };
}
