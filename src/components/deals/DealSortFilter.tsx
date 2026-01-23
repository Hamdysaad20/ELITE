"use client";

import { useState } from "react";
import { Filter, ArrowUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

const sortOptions: Array<{ value: DealSortOption; label: string }> = [
  { value: "discount-desc", label: "Biggest Discount" },
  { value: "discount-asc", label: "Smallest Discount" },
  { value: "savings-desc", label: "Biggest Savings" },
  { value: "savings-asc", label: "Smallest Savings" },
  { value: "price-desc", label: "Highest Price" },
  { value: "price-asc", label: "Lowest Price" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

export default function DealSortFilter({
  sortBy,
  onSortChange,
  productCount,
  className,
}: DealSortFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          Sort
        </span>
        <span className="text-xs font-cabin text-elite-black/60">
          ({sortOptions.find((o) => o.value === sortBy)?.label || "Default"})
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
                Sort Deals
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
                Showing{" "}
                <span className="font-bold text-elite-burgundy">
                  {productCount}
                </span>{" "}
                product{productCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
