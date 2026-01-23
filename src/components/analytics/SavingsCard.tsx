"use client";

import { Sparkles, TrendingUp } from "lucide-react";

interface SavingsCardProps {
  totalSaved: number;
  percentageChange?: number;
  period?: string;
  compact?: boolean;
}

export function SavingsCard({
  totalSaved,
  percentageChange,
  period = "last month",
  compact = false,
}: SavingsCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 rounded-2xl">
        <Sparkles className="w-4 h-4 text-elite-cream flex-shrink-0" />
        <div className="flex items-baseline gap-1">
          <span className="font-cabin font-bold text-elite-cream text-sm">
            Saved:
          </span>
          <span className="font-calistoga text-elite-cream text-base">
            {totalSaved.toFixed(2)}
          </span>
          <span className="font-cabin text-elite-cream/80 text-xs">EGP</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 rounded-3xl p-6 text-elite-cream shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-6 h-6" />
        <h3 className="font-calistoga text-xl">Total Saved</h3>
      </div>

      <p className="font-calistoga text-4xl mb-2">
        EGP {totalSaved.toFixed(2)}
      </p>

      {percentageChange !== undefined && (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-cabin">
            {percentageChange > 0 ? "+" : ""}
            {percentageChange.toFixed(1)}% vs {period}
          </span>
        </div>
      )}
    </div>
  );
}
