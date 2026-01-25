"use client";

import { useSession } from "next-auth/react";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname } from "@/i18n/routing";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";

interface UserActivationCTAProps {
  className?: string;
}

export default function UserActivationCTA({
  className,
}: UserActivationCTAProps) {
  const { data: session } = useSession();
  const localizedRouter = useLocalizedRouter();
  const locale = useLocale();
  const t = useTranslations("userActivation");
  const isRTL = locale === "ar";

  // Check if user is logged in
  if (!session?.user) {
    return null; // Don't show for non-logged-in users (or show different CTA)
  }

  // Check profile completeness (simplified - expand later)
  // TODO: Add more comprehensive checks (phone, address, preferences, etc.)
  // For now, just check if user has email (basic completeness)
  const isProfileComplete = !!session.user.email;

  if (isProfileComplete) {
    return null; // Don't show if profile is complete
  }

  const handleClick = () => {
    const dealsPath = addLocaleToPathname("/deals", locale);
    const profilePath = addLocaleToPathname("/profile", locale);
    localizedRouter.push(`${profilePath}?redirect=${encodeURIComponent(dealsPath)}`);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-elite-burgundy to-elite-burgundy/90 rounded-2xl p-6 md:p-8 text-elite-cream",
        "shadow-lg border border-elite-burgundy/20",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="bg-elite-cream/20 rounded-xl p-3 flex-shrink-0">
          <Sparkles className="w-6 h-6 text-elite-cream" />
        </div>

        <div className="flex-1">
          <h3 className="font-calistoga text-xl md:text-2xl mb-2">
            {t("title")}
          </h3>
          <p className="font-cabin text-elite-cream/90 mb-4 text-sm md:text-base">
            {t("description")}
          </p>

          <ul className="space-y-2 mb-4 text-sm md:text-base">
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              {t("benefits.0")}
            </li>
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              {t("benefits.1")}
            </li>
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              {t("benefits.2")}
            </li>
          </ul>

          <button
            onClick={handleClick}
            className="w-full sm:w-auto bg-elite-cream text-elite-burgundy px-6 py-3 rounded-xl font-cabin font-bold text-sm md:text-base hover:bg-elite-cream/90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <User className="w-4 h-4" />
            {t("cta")}
            <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
          </button>
        </div>
      </div>
    </div>
  );
}
