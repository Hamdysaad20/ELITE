"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { useLoyalty } from "@/hooks/useLoyalty";
import {
  LoyaltyCard,
  LoyaltyBenefits,
  LoyaltyActivity,
  LoyaltyTiers,
} from "@/components/LoyaltyCard";
import Footer from "@/components/Footer";
import { Loader2, AlertCircle, RefreshCw, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";

export default function RewardsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { loyalty, loading, error, refetch } = useLoyalty();
  const t = useTranslations("rewardsPage");

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 bg-elite-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-elite-burgundy animate-spin" />
            <p className="text-elite-black/70 font-cabin text-base">
              {t("loading")}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-elite-cream">
        {/* ── Page Hero ────────────────────────────────── */}
        <div className="bg-elite-burgundy text-elite-cream pt-8 pb-10 md:pt-12 md:pb-14 relative overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute top-0 end-0 w-48 h-48 border border-elite-cream/10 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 start-0 w-32 h-32 border border-elite-cream/10 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-elite-cream/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-elite-cream" />
              </div>
              <span className="font-cabin text-elite-cream/70 text-sm font-semibold uppercase tracking-wider">
                {t("title")}
              </span>
            </div>
            <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl text-elite-cream leading-tight mb-2">
              {t("subtitle")}
            </h1>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-10 md:pb-16">
          {/* Error state */}
          {error && (
            <div className="bg-white border-2 border-red-100 rounded-3xl p-6 sm:p-8 text-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="text-elite-black font-calistoga text-xl mb-2">
                {t("error.title")}
              </h3>
              <p className="text-elite-black/60 font-cabin text-sm mb-5">
                {error}
              </p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold active:scale-95 transition-all touch-manipulation"
              >
                <RefreshCw className="w-4 h-4" />
                {t("error.retry")}
              </button>
            </div>
          )}

          {/* Loyalty content */}
          {!error && loyalty && (
            <div className="space-y-6 md:space-y-8">
              {/* Loyalty Card */}
              <LoyaltyCard
                points={loyalty.account.points}
                level={loyalty.account.level}
                totalSpent={Number(loyalty.account.totalSpent)}
                progress={loyalty.tiers.progress}
                nextTier={loyalty.tiers.next}
              />

              {/* Benefits + Activity — stacked on mobile, side-by-side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
                <LoyaltyBenefits
                  benefits={loyalty.tiers.current.benefits}
                  level={loyalty.account.level}
                />
                <LoyaltyActivity activity={loyalty.recentActivity} />
              </div>

              {/* All Tiers */}
              <LoyaltyTiers
                tiers={loyalty.tiers.all}
                currentLevel={loyalty.account.level}
              />

              {/* How to Earn Points */}
              <div className="bg-white rounded-3xl p-5 md:p-8 border border-elite-burgundy/10 shadow-sm">
                <h3 className="font-calistoga text-elite-black text-xl md:text-2xl mb-6 flex items-center gap-2.5">
                  <span className="w-8 h-8 bg-elite-burgundy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-elite-burgundy" />
                  </span>
                  {t("earn.title")}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {/* Per EGP */}
                  <div className="bg-elite-cream/60 rounded-2xl p-4 md:p-5 text-center border border-elite-burgundy/8">
                    <p className="font-calistoga text-4xl text-elite-burgundy mb-1">
                      1
                    </p>
                    <p className="font-cabin text-xs text-elite-black/55 mb-1">
                      {t("earn.rules.onePer.label")}
                    </p>
                    <p className="font-cabin text-sm font-bold text-elite-black">
                      {t("earn.rules.onePer.value")}
                    </p>
                    <p className="font-cabin text-xs text-elite-black/60 mt-2 leading-relaxed">
                      {loyalty.account.level === "silver" &&
                        t("earn.rules.onePer.levels.silver")}
                      {loyalty.account.level === "gold" &&
                        t("earn.rules.onePer.levels.gold")}
                      {loyalty.account.level === "platinum" &&
                        t("earn.rules.onePer.levels.platinum")}
                      {loyalty.account.level === "bronze" &&
                        t("earn.rules.onePer.levels.bronze")}
                    </p>
                  </div>

                  {/* Birthday */}
                  <div className="bg-elite-cream/60 rounded-2xl p-4 md:p-5 text-center border border-elite-burgundy/8">
                    <p className="font-calistoga text-4xl text-elite-burgundy mb-1">
                      2×
                    </p>
                    <p className="font-cabin text-xs text-elite-black/55 mb-1">
                      {t("earn.rules.birthday.label")}
                    </p>
                    <p className="font-cabin text-sm font-bold text-elite-black">
                      {t("earn.rules.birthday.value")}
                    </p>
                    <p className="font-cabin text-xs text-elite-black/60 mt-2 leading-relaxed">
                      {t("earn.rules.birthday.description")}
                    </p>
                  </div>

                  {/* Referrals */}
                  <div className="bg-elite-cream/60 rounded-2xl p-4 md:p-5 text-center border border-elite-burgundy/8">
                    <p className="font-calistoga text-4xl text-elite-burgundy mb-1">
                      +50
                    </p>
                    <p className="font-cabin text-xs text-elite-black/55 mb-1">
                      {t("earn.rules.referrals.label")}
                    </p>
                    <p className="font-cabin text-sm font-bold text-elite-black">
                      {t("earn.rules.referrals.value")}
                    </p>
                    <p className="font-cabin text-xs text-elite-black/60 mt-2 leading-relaxed">
                      {t("earn.rules.referrals.description")}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pb-4">
                <LocalizedLink
                  href="/menu"
                  className="inline-flex items-center gap-2.5 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-bold text-base shadow-lg shadow-elite-burgundy/25 hover:shadow-xl hover:shadow-elite-burgundy/30 active:scale-[0.98] transition-all touch-manipulation"
                >
                  <Gift className="w-5 h-5" />
                  {t("actions.startEarning")}
                </LocalizedLink>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
