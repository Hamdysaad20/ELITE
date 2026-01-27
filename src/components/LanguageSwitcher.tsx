"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { localeCookieName, type Locale } from "@/i18n/config";
import { useLocaleSwitcher } from "@/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
};

const localeLabels: Record<Locale, { short: string; native: string }> = {
  en: { short: "EN", native: "English" },
  ar: { short: "AR", native: "العربية" },
};

function persistLocale(locale: Locale) {
  try {
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem(localeCookieName, locale);
  } catch {
    // Ignore storage errors
  }
}

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const switchLocale = useLocaleSwitcher();
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";

  const handleSwitch = () => {
    persistLocale(nextLocale);
    switchLocale(nextLocale);
  };

  return (
    <button
      onClick={handleSwitch}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-elite-burgundy/20 bg-elite-cream/80 px-3 py-2 text-sm font-cabin font-semibold text-elite-burgundy hover:bg-elite-cream transition-colors",
        className,
      )}
      aria-label={
        nextLocale === "ar" ? t("switchToArabic") : t("switchToEnglish")
      }
      type="button"
    >
      <Globe className="h-4 w-4" />
      <span className="uppercase tracking-wide">
        {localeLabels[nextLocale].short}
      </span>
    </button>
  );
}
