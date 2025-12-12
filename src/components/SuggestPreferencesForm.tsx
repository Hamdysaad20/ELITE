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

export interface SuggestPreferencesFormProps {
  onSuggest: (prefs: DrinkPreferences) => void;
  loading: boolean;
}

export function SuggestPreferencesForm({
  onSuggest,
  loading,
}: SuggestPreferencesFormProps) {
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
          Your Preferences
        </h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Temperature */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-elite-burgundy" />
            Temperature
          </span>
          <select
            className={selectClass}
            value={temperature}
            onChange={(e) =>
              setTemperature(e.target.value as "hot" | "iced" | "either")
            }
          >
            <option value="either">Either</option>
            <option value="hot">Hot</option>
            <option value="iced">Iced</option>
          </select>
        </label>

        {/* Caffeine */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-elite-burgundy" />
            Caffeine Level
          </span>
          <select
            className={selectClass}
            value={caffeine}
            onChange={(e) =>
              setCaffeine(e.target.value as "none" | "low" | "medium" | "high")
            }
          >
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        {/* Sweetness */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Candy className="w-4 h-4 text-elite-burgundy" />
            Sweetness
          </span>
          <select
            className={selectClass}
            value={sweetness}
            onChange={(e) =>
              setSweetness(e.target.value as "low" | "medium" | "high")
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        {/* Milk */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Milk className="w-4 h-4 text-elite-burgundy" />
            Milk Preference
          </span>
          <select
            className={selectClass}
            value={milk}
            onChange={(e) =>
              setMilk(e.target.value as "no-milk" | "dairy" | "non-dairy")
            }
          >
            <option value="dairy">Dairy</option>
            <option value="non-dairy">Non-dairy</option>
            <option value="no-milk">No milk</option>
          </select>
        </label>

        {/* Flavors */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-elite-burgundy" />
            Flavor Notes
          </span>
          <input
            className={inputClass}
            value={flavors}
            onChange={(e) => setFlavors(e.target.value)}
            placeholder="caramel, chocolate, vanilla"
          />
        </label>

        {/* Budget */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-elite-burgundy" />
            Max Budget (EGP)
          </span>
          <input
            className={inputClass}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 80"
            inputMode="decimal"
          />
        </label>

        {/* Size */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-elite-burgundy" />
            Size Preference
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
            <option value="">Auto (Best match)</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </label>

        {/* Time of Day */}
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-elite-burgundy" />
            Time of Day
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
            <option value="any">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
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
            Prioritize featured drinks
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-elite-burgundy text-elite-cream rounded-full font-calistoga text-lg tracking-wide shadow-lg transition-all duration-300 hover:opacity-90 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Sparkles className="w-5 h-5" />
        {loading ? "Finding your perfect drink..." : "Get My Suggestion"}
      </button>
    </form>
  );
}
