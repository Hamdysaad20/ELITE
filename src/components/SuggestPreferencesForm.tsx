"use client";
import React from "react";
import type { DrinkPreferences } from "@/hooks/useDrinkSuggestion";
import {
  Sparkles,
  Thermometer,
  Zap,
  Candy,
  Milk,
  Palette,
  Wallet,
  Ruler,
  Clock,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";

export interface SuggestPreferencesFormProps {
  onSuggest: (prefs: DrinkPreferences) => void;
  loading: boolean;
}

export function SuggestPreferencesForm({
  onSuggest,
  loading,
}: SuggestPreferencesFormProps) {
  const t = useTranslations("suggestForm");
  const [temperature, setTemperature] = React.useState<
    "hot" | "iced" | "either"
  >("either");
  const [caffeine, setCaffeine] = React.useState<
    "none" | "low" | "medium" | "high"
  >("medium");
  const [sweetness, setSweetness] = React.useState<"low" | "medium" | "high">(
    "medium",
  );
  const [milk, setMilk] = React.useState<"no-milk" | "dairy" | "non-dairy">(
    "dairy",
  );
  const [flavors, setFlavors] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [sizePreference, setSizePreference] = React.useState<
    "Small" | "Medium" | "Large" | ""
  >("");
  const [featuredBoost, setFeaturedBoost] = React.useState(true);
  const [timeOfDay, setTimeOfDay] = React.useState<
    "morning" | "afternoon" | "evening" | "any"
  >("any");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: DrinkPreferences = {
      temperature,
      caffeine,
      sweetness,
      milk,
      flavors: flavors
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      budget: budget ? Number(budget) : undefined,
      sizePreference: sizePreference || undefined,
      featuredBoost,
      timeOfDay,
    };
    onSuggest(prefs);
  };

  const selectClass =
    "mt-2 w-full border-2 border-elite-burgundy/20 rounded-xl px-4 py-3 font-cabin text-elite-black bg-white focus:border-elite-burgundy focus:ring-2 focus:ring-elite-burgundy/20 outline-none transition-all";
  const inputClass =
    "mt-2 w-full border-2 border-elite-burgundy/20 rounded-xl px-4 py-3 font-cabin text-elite-black bg-white focus:border-elite-burgundy focus:ring-2 focus:ring-elite-burgundy/20 outline-none transition-all placeholder:text-elite-black/40";
  const labelClass =
    "flex flex-col text-sm font-cabin font-medium text-elite-black/80";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-elite-burgundy/20">
        <Sparkles className="w-5 h-5 text-elite-burgundy" />
        <h3 className="font-calistoga text-elite-burgundy text-xl">
          {t("title")}
        </h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Temperature */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-elite-burgundy" />
            {t("temperature.label")}
          </span>
          <select
            className={selectClass}
            value={temperature}
            onChange={(e) =>
              setTemperature(e.target.value as "hot" | "iced" | "either")
            }
          >
            <option value="either">{t("temperature.options.either")}</option>
            <option value="hot">{t("temperature.options.hot")}</option>
            <option value="iced">{t("temperature.options.iced")}</option>
          </select>
        </label>

        {/* Caffeine */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-elite-burgundy" />
            {t("caffeine.label")}
          </span>
          <select
            className={selectClass}
            value={caffeine}
            onChange={(e) =>
              setCaffeine(e.target.value as "none" | "low" | "medium" | "high")
            }
          >
            <option value="none">{t("caffeine.options.none")}</option>
            <option value="low">{t("caffeine.options.low")}</option>
            <option value="medium">{t("caffeine.options.medium")}</option>
            <option value="high">{t("caffeine.options.high")}</option>
          </select>
        </label>

        {/* Sweetness */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Candy className="w-4 h-4 text-elite-burgundy" />
            {t("sweetness.label")}
          </span>
          <select
            className={selectClass}
            value={sweetness}
            onChange={(e) =>
              setSweetness(e.target.value as "low" | "medium" | "high")
            }
          >
            <option value="low">{t("sweetness.options.low")}</option>
            <option value="medium">{t("sweetness.options.medium")}</option>
            <option value="high">{t("sweetness.options.high")}</option>
          </select>
        </label>

        {/* Milk */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Milk className="w-4 h-4 text-elite-burgundy" />
            {t("milk.label")}
          </span>
          <select
            className={selectClass}
            value={milk}
            onChange={(e) =>
              setMilk(e.target.value as "no-milk" | "dairy" | "non-dairy")
            }
          >
            <option value="dairy">{t("milk.options.dairy")}</option>
            <option value="non-dairy">{t("milk.options.nonDairy")}</option>
            <option value="no-milk">{t("milk.options.none")}</option>
          </select>
        </label>

        {/* Flavors */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-elite-burgundy" />
            {t("flavors.label")}
          </span>
          <input
            className={inputClass}
            value={flavors}
            onChange={(e) => setFlavors(e.target.value)}
            placeholder={t("flavors.placeholder")}
          />
        </label>

        {/* Budget */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-elite-burgundy" />
            {t("budget.label")}
          </span>
          <input
            className={inputClass}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder={t("budget.placeholder")}
            inputMode="decimal"
          />
        </label>

        {/* Size */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-elite-burgundy" />
            {t("size.label")}
          </span>
          <select
            className={selectClass}
            value={sizePreference}
            onChange={(e) =>
              setSizePreference(
                e.target.value as "Small" | "Medium" | "Large" | "",
              )
            }
          >
            <option value="">{t("size.options.auto")}</option>
            <option value="Small">{t("size.options.small")}</option>
            <option value="Medium">{t("size.options.medium")}</option>
            <option value="Large">{t("size.options.large")}</option>
          </select>
        </label>

        {/* Time of Day */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-elite-burgundy" />
            {t("timeOfDay.label")}
          </span>
          <select
            className={selectClass}
            value={timeOfDay}
            onChange={(e) =>
              setTimeOfDay(
                e.target.value as "morning" | "afternoon" | "evening" | "any",
              )
            }
          >
            <option value="any">{t("timeOfDay.options.any")}</option>
            <option value="morning">{t("timeOfDay.options.morning")}</option>
            <option value="afternoon">{t("timeOfDay.options.afternoon")}</option>
            <option value="evening">{t("timeOfDay.options.evening")}</option>
          </select>
        </label>

        {/* Featured Boost */}
        <label className="flex items-center gap-3 sm:col-span-2 lg:col-span-1 p-4 bg-elite-cream/50 rounded-xl cursor-pointer hover:bg-elite-cream transition-colors">
          <input
            type="checkbox"
            checked={featuredBoost}
            onChange={(e) => setFeaturedBoost(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-elite-burgundy/30 text-elite-burgundy focus:ring-elite-burgundy"
          />
          <span className="flex items-center gap-2 font-cabin font-medium text-elite-black/80">
            <Star className="w-4 h-4 text-elite-burgundy" />
            {t("featuredBoost")}
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-full font-calistoga text-lg tracking-wide shadow-lg transition-all duration-300 hover:opacity-90 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Sparkles className="w-5 h-5" />
        {loading ? t("submit.loading") : t("submit.default")}
      </button>
    </form>
  );
}
