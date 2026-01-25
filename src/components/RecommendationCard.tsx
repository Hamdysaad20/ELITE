"use client";
import React from "react";
import type { MenuItem } from "@/types";
import { ShoppingCart, Check, Sparkles, Tag } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface BaseRec {
  item: MenuItem;
  suggestedSize?: string;
  suggestedFlavors?: string[];
  reasons: string[];
}

export interface RecommendationCardProps {
  title: string;
  recommendation: BaseRec;
  onAdd: (item: MenuItem, size?: string, flavor?: string) => void;
  primary?: boolean;
}

export function RecommendationCard({
  title,
  recommendation,
  onAdd,
  primary,
}: RecommendationCardProps) {
  const { item, suggestedSize, suggestedFlavors, reasons } = recommendation;
  const flavor = suggestedFlavors?.[0];
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const t = useTranslations("recommendationCard");
  const format = useFormatter();

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await onAdd(item, suggestedSize, flavor);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 p-6 space-y-4 transition-all duration-300 hover:shadow-lg ${
        primary
          ? "bg-gradient-to-br from-elite-burgundy/5 to-elite-cream border-elite-burgundy/30 shadow-md"
          : "bg-white border-elite-burgundy/10 hover:border-elite-burgundy/20"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {primary && <Sparkles className="w-4 h-4 text-elite-burgundy" />}
            <span className="font-cabin text-xs font-semibold text-elite-burgundy uppercase tracking-wide">
              {title}
            </span>
          </div>
          <h3 className="font-calistoga text-elite-black text-xl md:text-2xl">
            {item.name}
          </h3>
          {item.description && (
            <p className="font-cabin text-elite-black/70 text-sm mt-2 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-calistoga text-elite-burgundy text-2xl">
            {formatPrice(item.price)}
          </div>
        </div>
      </div>

      {/* Suggested options */}
      {(suggestedSize || flavor) && (
        <div className="flex flex-wrap gap-2">
          {suggestedSize && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-elite-burgundy/10 text-elite-burgundy rounded-full text-xs font-cabin font-medium">
              <Tag className="w-3 h-3" />
              {suggestedSize}
            </span>
          )}
          {flavor && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-elite-burgundy/10 text-elite-burgundy rounded-full text-xs font-cabin font-medium">
              {flavor}
            </span>
          )}
        </div>
      )}

      {/* Reasons */}
      {reasons?.length ? (
        <div className="space-y-2">
          <p className="font-cabin text-xs font-semibold text-elite-black/60 uppercase tracking-wide">
            {t("reasonsTitle")}
          </p>
          <ul className="space-y-1.5">
            {reasons.slice(0, 4).map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 font-cabin text-sm text-elite-black/80"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-elite-burgundy mt-1.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={adding}
        className={`w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-base tracking-wide shadow-md transition-all duration-300 ${
          added
            ? "bg-emerald-600 text-white font-calistoga"
            : "bg-elite-burgundy text-elite-cream font-calistoga hover:opacity-90 hover:scale-[1.02] hover:shadow-lg"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            <span>{t("actions.added")}</span>
          </>
        ) : adding ? (
          <span className="font-cabin">{t("actions.adding")}</span>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>{t("actions.add")}</span>
          </>
        )}
      </button>
    </div>
  );
}
