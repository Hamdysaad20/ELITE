"use client";

import { useCallback, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { localeCookieName, type Locale } from "@/i18n/config";
import { useLocaleSwitcher } from "@/hooks/useLocalizedRouter";
import { switchLocale as buildSwitchedPath } from "@/i18n/routing";

interface LangToggleProps {
  className?: string;
  variant?: "pill" | "full";
}

function persistLocale(locale: Locale) {
  try {
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem(localeCookieName, locale);
  } catch {
    // Ignore storage errors
  }
}

export default function LangToggle({
  className,
  variant = "pill",
}: LangToggleProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("globalNav");
  const switchLocale = useLocaleSwitcher();
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const prefetched = useRef(false);

  // Prefetch the alternate locale route on hover/focus
  const handlePrefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(buildSwitchedPath(pathname, nextLocale));
  }, [router, pathname, nextLocale]);

  const handleSwitch = () => {
    persistLocale(nextLocale);
    // Optimistic: immediately flip dir so layout shift feels instant
    document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLocale;
    switchLocale(nextLocale);
  };

  const label = t("switchLang");

  if (variant === "full") {
    return (
      <button
        onClick={handleSwitch}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        className={`w-full py-3 font-cabin text-[13px] font-semibold tracking-wide transition-all duration-200 nav-focus-ring nav-lang-btn active:scale-[0.98] ${className || ""}`}
        style={{ borderRadius: "var(--nav-radius-lg)" }}
        aria-label={t("switchLangLabel")}
        type="button"
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleSwitch}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={`inline-flex items-center justify-center min-w-[5.5rem] px-5 py-1.5 font-cabin text-[12px] font-semibold tracking-wide transition-all duration-200 nav-focus-ring nav-lang-btn active:scale-95 ${className || ""}`}
      style={{ borderRadius: "var(--nav-radius)" }}
      aria-label={t("switchLangLabel")}
      type="button"
    >
      {label}
    </button>
  );
}
