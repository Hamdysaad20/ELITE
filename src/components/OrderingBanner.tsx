"use client";

import { useState } from "react";
import { X, MapPin } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useOrdering } from "@/context/OrderingContext";
import { SUPPORT_MESSENGER_URL } from "@/lib/support";

export function OrderingBanner() {
  const { orderingEnabled, loading } = useOrdering();
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations("orderingBanner");

  if (loading || orderingEnabled || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-elite-burgundy text-elite-cream"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <MapPin className="w-4 h-4 flex-shrink-0 opacity-70" aria-hidden />

        <p className="font-cabin text-sm flex-1 min-w-0">{t("message")}</p>

        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={SUPPORT_MESSENGER_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-cabin text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:inline"
          >
            {t("getUpdates")}
          </a>

          <Link
            href="/#location"
            className="font-cabin text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            {t("findUs")}
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/15 transition-colors"
            aria-label={t("dismiss")}
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
