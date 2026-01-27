"use client";

import { useState } from "react";
import { Filter, ArrowUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type DealSortOption =
  | "discount-desc" // Biggest discount first (default)
  | "discount-asc" // Smallest discount first
  | "price-desc" // Highest price first
  | "price-asc" // Lowest price first
  | "savings-desc" // Biggest savings (EGP) first
  | "savings-asc" // Smallest savings (EGP) first
  | "name-asc" // Alphabetical A-Z
  | "name-desc"; // Alphabetical Z-A

interface DealSortFilterProps {
  sortBy: DealSortOption;
  onSortChange: (sort: DealSortOption) => void;
  productCount: number;
  className?: string;
}

export default function DealSortFilter({
  sortBy,
  onSortChange,
  productCount,
  className,
}: DealSortFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("dealSort");
  const sortOptions: Array<{ value: DealSortOption; label: string }> = [
    { value: "discount-desc", label: t("options.discountDesc") },
    { value: "discount-asc", label: t("options.discountAsc") },
    { value: "savings-desc", label: t("options.savingsDesc") },
    { value: "savings-asc", label: t("options.savingsAsc") },
    { value: "price-desc", label: t("options.priceDesc") },
    { value: "price-asc", label: t("options.priceAsc") },
    { value: "name-asc", label: t("options.nameAsc") },
    { value: "name-desc", label: t("options.nameDesc") },
  ];

  return (
    <div className={cn("relative", className)}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all touch-manipulation active:scale-95"
      >
        <Filter className="w-4 h-4 text-elite-burgundy" />
        <ArrowUpDown className="w-4 h-4 text-elite-burgundy" />
        <span className="font-cabin font-semibold text-elite-black text-sm">
          {t("label")}
        </span>
        <span className="text-xs font-cabin text-elite-black/60">
          ({sortOptions.find((o) => o.value === sortBy)?.label || t("default")})
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border-2 border-elite-burgundy/10 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-elite-burgundy/10">
              <h3 className="font-calistoga text-lg text-elite-black">
                {t("title")}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-elite-cream transition-colors"
              >
                <X className="w-4 h-4 text-elite-black" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-cabin font-semibold transition-all touch-manipulation active:scale-95",
                    sortBy === option.value
                      ? "bg-elite-burgundy text-elite-cream shadow-md"
                      : "bg-elite-cream text-elite-black hover:bg-elite-burgundy/10",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-3 border-t border-elite-burgundy/10">
              <p className="text-xs font-cabin text-elite-black/60 text-center">
                {t("results", {
                  count: productCount,
                  value: productCount,
                })}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
