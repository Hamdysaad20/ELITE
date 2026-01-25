"use client";

import { Award, TrendingUp, Gift, Star, Crown, Gem } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface LoyaltyCardProps {
  points: number;
  level: string;
  totalSpent: number;
  progress: number;
  nextTier: { level: string; minPoints: number } | null;
}

const TIER_ICONS = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Gem,
};

const TIER_COLORS = {
  bronze: {
    bg: "from-amber-700 to-amber-900",
    text: "text-amber-100",
    badge: "bg-amber-800",
    progress: "bg-amber-600",
  },
  silver: {
    bg: "from-gray-400 to-gray-600",
    text: "text-gray-100",
    badge: "bg-gray-500",
    progress: "bg-gray-400",
  },
  gold: {
    bg: "from-yellow-400 to-yellow-600",
    text: "text-yellow-900",
    badge: "bg-yellow-500",
    progress: "bg-yellow-400",
  },
  platinum: {
    bg: "from-purple-600 to-purple-900",
    text: "text-purple-100",
    badge: "bg-purple-700",
    progress: "bg-purple-500",
  },
};

export function LoyaltyCard({
  points,
  level,
  totalSpent,
  progress,
  nextTier,
}: LoyaltyCardProps) {
  const t = useTranslations("loyalty");
  const format = useFormatter();
  const Icon = TIER_ICONS[level as keyof typeof TIER_ICONS] || Award;
  const colors =
    TIER_COLORS[level as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;
  const levelLabels: Record<string, string> = {
    bronze: t("levels.bronze"),
    silver: t("levels.silver"),
    gold: t("levels.gold"),
    platinum: t("levels.platinum"),
  };
  const levelLabel = levelLabels[level] || level;
  const nextLevelLabel = nextTier
    ? levelLabels[nextTier.level] || nextTier.level
    : "";

  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  return (
    <div
      className={`relative bg-gradient-to-br ${colors.bg} rounded-3xl shadow-2xl overflow-hidden`}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${colors.badge} backdrop-blur-sm`}>
              <Icon className={`w-8 h-8 ${colors.text}`} />
            </div>
            <div>
              <p className={`text-sm ${colors.text} opacity-80 font-cabin`}>
                {t("card.statusLabel")}
              </p>
              <h2
                className={`text-2xl font-calistoga ${colors.text} capitalize`}
              >
                {t("card.memberLabel", { level: levelLabel })}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm ${colors.text} opacity-80 font-cabin`}>
              {t("card.totalSpent")}
            </p>
            <p className={`text-xl font-bold ${colors.text} font-cabin`}>
              {formatCurrency(Number(totalSpent))}
            </p>
          </div>
        </div>

        {/* Points Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className={`text-5xl font-bold ${colors.text} font-calistoga`}>
              {points}
            </h3>
            <span className={`text-xl ${colors.text} opacity-80 font-cabin`}>
              {t("card.pointsLabel")}
            </span>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${colors.text} opacity-80 font-cabin`}>
                {t("card.progressTo", { level: nextLevelLabel })}
              </p>
              <p className={`text-sm font-bold ${colors.text} font-cabin`}>
                {Math.round(progress)}%
              </p>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className={`text-xs ${colors.text} opacity-70 mt-2 font-cabin`}>
              {t("card.pointsToNext", {
                count: nextTier.minPoints - points,
                level: nextLevelLabel,
              })}
            </p>
          </div>
        )}

        {/* Max Tier Message */}
        {!nextTier && (
          <div className={`text-center py-4 ${colors.text}`}>
            <Crown className="w-12 h-12 mx-auto mb-2 opacity-80" />
            <p className="font-cabin font-semibold">
              {t("card.maxTier.title")}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {t("card.maxTier.subtitle")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface LoyaltyBenefitsProps {
  benefits: string[];
  level: string;
}

export function LoyaltyBenefits({ benefits, level }: LoyaltyBenefitsProps) {
  const t = useTranslations("loyalty");
  const colors =
    TIER_COLORS[level as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.bg}`}>
          <Gift className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-calistoga text-gray-900">
          {t("benefits.title")}
        </h3>
      </div>

      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center mt-0.5`}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-gray-700 font-cabin">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface LoyaltyActivityProps {
  activity: Array<{
    id: string;
    deltaPoints: number;
    reason: string | null;
    orderId: string | null;
    orderTotal?: number;
    createdAt: Date;
  }>;
}

interface LoyaltyTier {
  level: string;
  minPoints: number;
  benefits: string[];
}

export function LoyaltyActivity({ activity }: LoyaltyActivityProps) {
  const t = useTranslations("loyalty");
  const format = useFormatter();

  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  if (activity.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-cabin">{t("activity.empty.title")}</p>
        <p className="text-sm text-gray-500 font-cabin mt-1">
          {t("activity.empty.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-elite-burgundy" />
        <h3 className="text-xl font-calistoga text-gray-900">
          {t("activity.title")}
        </h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activity.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    item.deltaPoints > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.deltaPoints > 0 ? "+" : ""}
                  {t("activity.points", {
                    count: Math.abs(item.deltaPoints),
                  })}
                </span>
                <span className="text-sm text-gray-600 font-cabin">
                  {item.reason || t("activity.reasonFallback")}
                </span>
              </div>
              {item.orderTotal && (
                <p className="text-xs text-gray-500 mt-1 font-cabin">
                  {t("activity.orderTotal", {
                    amount: formatCurrency(Number(item.orderTotal)),
                  })}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 font-cabin">
                {format.dateTime(new Date(item.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LoyaltyTiersProps {
  tiers: LoyaltyTier[];
  currentLevel: string;
}

export function LoyaltyTiers({ tiers, currentLevel }: LoyaltyTiersProps) {
  const t = useTranslations("loyalty");
  const format = useFormatter();
  const levelLabels: Record<string, string> = {
    bronze: t("levels.bronze"),
    silver: t("levels.silver"),
    gold: t("levels.gold"),
    platinum: t("levels.platinum"),
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-xl font-calistoga text-gray-900 mb-6">
        {t("tiers.title")}
      </h3>

      <div className="space-y-4">
        {tiers.map((tier, index) => {
          const Icon =
            TIER_ICONS[tier.level as keyof typeof TIER_ICONS] || Award;
          const colors =
            TIER_COLORS[tier.level as keyof typeof TIER_COLORS] ||
            TIER_COLORS.bronze;
          const isCurrent = tier.level === currentLevel;

          return (
            <div
              key={tier.level}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isCurrent
                  ? `border-transparent bg-gradient-to-r ${colors.bg}`
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {isCurrent && (
                <div className="absolute top-2 right-2">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {t("tiers.current")}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isCurrent ? "bg-white/20" : "bg-gray-200"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isCurrent ? "text-white" : "text-gray-600"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`font-calistoga text-lg capitalize ${
                        isCurrent ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {levelLabels[tier.level] || tier.level}
                    </h4>
                  </div>

                  <p
                    className={`text-sm mb-2 font-cabin ${
                      isCurrent ? "text-white/80" : "text-gray-600"
                    }`}
                  >
                    {tier.minPoints === 0
                      ? t("tiers.starting")
                      : t("tiers.pointsThreshold", {
                          count: format.number(tier.minPoints),
                        })}
                  </p>

                  <ul className="space-y-1">
                    {tier.benefits.slice(0, 3).map((benefit, i) => (
                      <li
                        key={i}
                        className={`text-xs flex items-center gap-2 font-cabin ${
                          isCurrent ? "text-white/90" : "text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCurrent ? "bg-white/60" : "bg-gray-400"
                          }`}
                        ></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
