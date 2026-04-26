"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ITEM_SECTIONS } from "@/lib/inventory/constants";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { cn } from "@/lib/utils";

interface StockLevel {
  itemId: string;
  name: string;
  nameAr: string;
  section: string;
  unit: string;
  unitAr: string;
  storageQty: number;
  barQty: number;
  totalQty: number;
  minimumStock: number;
  alertLevel: number;
  barStatus: "ok" | "bar_empty" | "empty";
  totalStatus: "ok" | "warning" | "order_now" | "empty";
}

interface StockData {
  levels: StockLevel[];
  alerts: StockLevel[];
  totalItems: number;
}

interface TodayActivity {
  counts: number;
  transfers: number;
  waste: number;
}

const STATUS_COLOR: Record<string, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-400",
  order_now: "bg-orange-500",
  empty: "bg-red-500",
  bar_empty: "bg-orange-500",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> =
  {
    ok: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    order_now: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    empty: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };

function formatQuantity(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations("admin.dashboard");
  const tSections = useTranslations("admin.sections");
  const tCommon = useTranslations("admin.common");
  const isAr = locale === "ar";

  const sectionOptions = useMemo(
    () => [
      { value: "", label: t("allSections") },
      ...ITEM_SECTIONS.map((s) => ({ value: s, label: tSections(s) })),
    ],
    [t, tSections],
  );

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [activity, setActivity] = useState<TodayActivity>({
    counts: 0,
    transfers: 0,
    waste: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (sectionFilter) params.set("section", sectionFilter);

    Promise.all([
      fetch(`/api/admin/stock?${params}`).then((r) => r.json()),
      fetch("/api/admin/transfers").then((r) => r.json()),
      fetch("/api/admin/waste").then((r) => r.json()),
      fetch(
        `/api/admin/inventory?location=bar&date=${new Date().toISOString().split("T")[0]}`,
      ).then((r) => r.json()),
    ])
      .then(([stockRes, transfersRes, wasteRes, countsRes]) => {
        if (stockRes.success) setStockData(stockRes.data);
        setActivity({
          counts: countsRes.data?.length || 0,
          transfers: transfersRes.data?.length || 0,
          waste: wasteRes.data?.length || 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sectionFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="mb-6">
        <h1 className="font-calistoga text-2xl text-elite-burgundy mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-elite-black/50 font-cabin">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: t("countsToday"),
            value: activity.counts,
            color: "text-elite-burgundy",
            iconBg: "bg-elite-burgundy/8",
            icon: (
              <svg
                className="w-5 h-5 text-elite-burgundy"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
              </svg>
            ),
          },
          {
            label: t("transfersToday"),
            value: activity.transfers,
            color: "text-blue-700",
            iconBg: "bg-blue-50",
            icon: (
              <svg
                className="w-5 h-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3 4 7l4 4" />
                <path d="M4 7h16" />
                <path d="m16 21 4-4-4-4" />
                <path d="M20 17H4" />
              </svg>
            ),
          },
          {
            label: t("wasteToday"),
            value: activity.waste,
            color: "text-amber-700",
            iconBg: "bg-amber-50",
            icon: (
              <svg
                className="w-5 h-5 text-amber-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            ),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-elite-burgundy/8 p-4"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
                stat.iconBg,
              )}
            >
              {stat.icon}
            </div>
            <div className={cn("font-calistoga text-2xl", stat.color)}>
              {stat.value}
            </div>
            <div className="text-xs text-elite-black/45 font-cabin mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {stockData && stockData.alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="font-calistoga text-base text-elite-burgundy mb-3">
            {t("alerts")} ({stockData.alerts.length})
          </h2>
          <div className="grid gap-2">
            {stockData.alerts.map((a) => (
              <div
                key={a.itemId}
                className={cn(
                  "flex items-center justify-between bg-white rounded-xl border px-4 py-3",
                  a.totalStatus === "empty"
                    ? "border-red-200 bg-red-50/30"
                    : a.totalStatus === "order_now"
                      ? "border-orange-200 bg-orange-50/30"
                      : "border-amber-200 bg-amber-50/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      STATUS_COLOR[a.totalStatus],
                    )}
                  />
                  <span className="text-sm font-cabin text-elite-black">
                    {isAr ? a.nameAr : a.name}
                  </span>
                </div>
                <span className="text-sm font-cabin text-elite-black/50">
                  {formatQuantity(a.totalQty, locale)}{" "}
                  {isAr ? a.unitAr : a.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stockData && stockData.alerts.length === 0 && (
        <div className="mb-6 flex items-center gap-3 bg-white rounded-xl border border-emerald-200 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-sm font-cabin text-emerald-700">
            {t("noAlerts")}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="font-calistoga text-base text-elite-burgundy">
          {t("stockOverview")}
        </h2>
        <div className="w-48">
          <SearchableSelect
            value={sectionFilter}
            onChange={setSectionFilter}
            options={sectionOptions}
            placeholder={t("allSections")}
            searchPlaceholder={tCommon("search")}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-elite-burgundy/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-cabin">
            <thead>
              <tr className="border-b border-elite-burgundy/8">
                <th className="text-start px-4 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40">
                  {t("itemName")}
                </th>
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40 hidden min-[480px]:table-cell">
                  {t("storageQty")}
                </th>
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40 hidden min-[480px]:table-cell">
                  {t("barQty")}
                </th>
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40">
                  {t("totalQty")}
                </th>
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40">
                  {t("barStatus")}
                </th>
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40 hidden min-[640px]:table-cell">
                  {t("totalStatus")}
                </th>
              </tr>
            </thead>
            <tbody>
              {stockData?.levels.map((level, i) => {
                const badge =
                  STATUS_BADGE[level.totalStatus] ?? STATUS_BADGE.ok;
                return (
                  <tr
                    key={level.itemId}
                    className={cn(
                      "border-b border-elite-burgundy/5 last:border-0",
                      level.totalStatus === "empty" && "bg-red-50/40",
                      level.totalStatus === "order_now" && "bg-orange-50/30",
                      level.totalStatus === "ok" &&
                        i % 2 === 0 &&
                        "bg-elite-cream/20",
                    )}
                  >
                    <td className="px-4 py-2.5 text-elite-black">
                      {isAr ? level.nameAr : level.name}
                    </td>
                    <td className="text-center px-3 py-2.5 text-elite-black/50 hidden min-[480px]:table-cell">
                      {formatQuantity(level.storageQty, locale)}{" "}
                      {isAr ? level.unitAr : level.unit}
                    </td>
                    <td className="text-center px-3 py-2.5 text-elite-black/50 hidden min-[480px]:table-cell">
                      {formatQuantity(level.barQty, locale)}{" "}
                      {isAr ? level.unitAr : level.unit}
                    </td>
                    <td className="text-center px-3 py-2.5 font-medium text-elite-black">
                      {formatQuantity(level.totalQty, locale)}{" "}
                      {isAr ? level.unitAr : level.unit}
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span className="inline-flex items-center justify-center">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            STATUS_COLOR[level.barStatus],
                          )}
                        />
                      </span>
                    </td>
                    <td className="text-center px-3 py-2.5 hidden min-[640px]:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full",
                          badge.bg,
                          badge.text,
                        )}
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", badge.dot)}
                        />
                        {t(`status.${level.totalStatus}`)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
