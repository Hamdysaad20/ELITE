"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  warning: "bg-amber-400",
  order_now: "bg-orange-400",
  empty: "bg-red-400",
};

export default function ItemsPage() {
  const locale = useLocale();
  const t = useTranslations("admin.items");
  const tSections = useTranslations("admin.sections");
  const isAr = locale === "ar";

  const { grouped, loading } = useInventoryItems();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) || item.nameAr.includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [grouped, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <div className="mb-5">
        <h1 className="font-calistoga text-2xl text-elite-burgundy mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-elite-black/60 font-cabin">
          {t("subtitle")}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-elite-black/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full h-11 ps-9 pe-4 bg-white border border-elite-burgundy/15 rounded-2xl text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-elite-black/40 font-cabin text-center py-12">
          {t("noItems")}
        </p>
      )}

      <div className="space-y-4">
        {filtered.map((group) => (
          <div
            key={group.section}
            className="bg-white rounded-2xl border border-elite-burgundy/10 overflow-hidden"
          >
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3 bg-elite-cream/40 border-b border-elite-burgundy/8">
              <span className="font-calistoga text-sm text-elite-burgundy">
                {tSections(group.section)}
              </span>
              <span className="text-xs font-cabin text-elite-black/40">
                {t("itemCount", { count: group.items.length })}
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 border-b border-elite-burgundy/5 text-xs font-cabin text-elite-black/40">
              <span>{t("name")}</span>
              <span className="w-12 text-center">{t("unit")}</span>
              <span className="w-12 text-center hidden min-[420px]:block">
                {t("locations")}
              </span>
              <span className="w-16 text-center">{t("minStock")}</span>
            </div>

            {/* Items */}
            {group.items.map((item) => {
              const stockStatus = item.minimumStock > 0 ? "ok" : "ok";
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-b border-elite-burgundy/5 last:border-0 hover:bg-elite-cream/20 transition-colors"
                >
                  {/* Name */}
                  <span className="text-sm font-cabin text-elite-black truncate">
                    {isAr ? item.nameAr : item.name}
                  </span>

                  {/* Unit */}
                  <span className="w-12 text-center text-xs font-cabin text-elite-black/50 bg-elite-cream/60 px-1.5 py-0.5 rounded-lg">
                    {isAr ? item.unitAr : item.unit}
                  </span>

                  {/* Location flags */}
                  <div className="w-12 hidden min-[420px]:flex items-center justify-center gap-1">
                    {item.isDailyBarCounted && (
                      <span
                        title={t("bar")}
                        className="text-[10px] font-cabin bg-elite-burgundy/10 text-elite-burgundy px-1 py-0.5 rounded"
                      >
                        B
                      </span>
                    )}
                    {item.isStorageCounted && (
                      <span
                        title={t("storage")}
                        className="text-[10px] font-cabin bg-elite-black/8 text-elite-black/60 px-1 py-0.5 rounded"
                      >
                        S
                      </span>
                    )}
                  </div>

                  {/* Min stock */}
                  <div className="w-16 flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        item.minimumStock > 0
                          ? STATUS_DOT.ok
                          : "bg-elite-black/20",
                      )}
                    />
                    <span className="text-xs font-cabin text-elite-black/60">
                      {item.minimumStock > 0 ? item.minimumStock : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
