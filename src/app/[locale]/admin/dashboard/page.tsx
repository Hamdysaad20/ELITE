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
  preferredSupplier: string | null;
  unit: string;
  unitAr: string;
  storageQty: number;
  barQty: number;
  totalQty: number;
  minimumStock: number;
  alertLevel: number;
  targetStock: number;
  backupThreshold: number;
  barStatus: "ok" | "bar_empty" | "empty";
  totalStatus: "ok" | "warning" | "order_now" | "backup_order" | "empty";
  fallbackThreshold: number;
  statusReason:
    | "minimum_stock"
    | "backup_threshold"
    | "alert_level"
    | "empty"
    | "healthy";
  suggestedOrderQty: number;
  averageDailyUsage: number;
  daysRemaining: number | null;
  lastCountedAt: string | null;
  auditWarnings: string[];
}

interface StockData {
  levels: StockLevel[];
  alerts: StockLevel[];
  totalItems: number;
  suppliers: string[];
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
  backup_order: "bg-fuchsia-500",
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
    backup_order: {
      bg: "bg-fuchsia-50",
      text: "text-fuchsia-700",
      dot: "bg-fuchsia-500",
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
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [missingMinimumOnly, setMissingMinimumOnly] = useState(false);
  const [actionableOnly, setActionableOnly] = useState(false);
  const stockInsights = useMemo(() => {
    const counts = {
      orderNow: 0,
      backupOrder: 0,
      warnings: 0,
      audit: 0,
      missing: 0,
    };
    if (!stockData) return counts;
    for (const i of stockData.levels) {
      if (i.totalStatus === "order_now" || i.totalStatus === "empty")
        counts.orderNow++;
      else if (i.totalStatus === "backup_order") counts.backupOrder++;
      else if (i.totalStatus === "warning") counts.warnings++;
      if (i.auditWarnings.length > 0) counts.audit++;
      if (i.minimumStock <= 0) counts.missing++;
    }
    return counts;
  }, [stockData]);
  const orderingPlan = useMemo(() => {
    if (!stockData) return [];
    return stockData.levels
      .filter((level) => level.suggestedOrderQty > 0)
      .sort((a, b) => {
        const supplierCompare = (a.preferredSupplier || "").localeCompare(
          b.preferredSupplier || "",
        );
        if (supplierCompare !== 0) return supplierCompare;
        return b.suggestedOrderQty - a.suggestedOrderQty;
      });
  }, [stockData]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sectionFilter) params.set("section", sectionFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (supplierFilter) params.set("supplier", supplierFilter);
    if (missingMinimumOnly) params.set("missingMinimum", "true");
    if (actionableOnly) params.set("actionable", "true");

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
  }, [
    sectionFilter,
    statusFilter,
    supplierFilter,
    missingMinimumOnly,
    actionableOnly,
  ]);

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
                      : a.totalStatus === "backup_order"
                        ? "border-fuchsia-200 bg-fuchsia-50/30"
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
                  {a.suggestedOrderQty > 0 &&
                    ` -> ${formatQuantity(a.suggestedOrderQty, locale)} ${
                      isAr ? a.unitAr : a.unit
                    }`}
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

      <div className="grid grid-cols-2 min-[720px]:grid-cols-5 gap-3 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <div className="text-xs text-red-700 font-cabin">
            {t("diagram.orderNow")}
          </div>
          <div className="text-2xl text-red-700 font-calistoga">
            {stockInsights.orderNow}
          </div>
        </div>
        <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-3">
          <div className="text-xs text-fuchsia-700 font-cabin">
            {t("diagram.backupOrder")}
          </div>
          <div className="text-2xl text-fuchsia-700 font-calistoga">
            {stockInsights.backupOrder}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <div className="text-xs text-amber-700 font-cabin">
            {t("diagram.warning")}
          </div>
          <div className="text-2xl text-amber-700 font-calistoga">
            {stockInsights.warnings}
          </div>
        </div>
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
          <div className="text-xs text-sky-700 font-cabin">
            {t("diagram.audit")}
          </div>
          <div className="text-2xl text-sky-700 font-calistoga">
            {stockInsights.audit}
          </div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
          <div className="text-xs text-stone-700 font-cabin">
            {t("diagram.missingMinimum")}
          </div>
          <div className="text-2xl text-stone-700 font-calistoga">
            {stockInsights.missing}
          </div>
        </div>
      </div>

      {orderingPlan.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-elite-burgundy/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-elite-burgundy/8">
            <h2 className="font-calistoga text-base text-elite-burgundy">
              {t("orderingPlan")}
            </h2>
            <p className="text-xs text-elite-black/45 font-cabin mt-0.5">
              {t("orderingPlanDesc")}
            </p>
          </div>
          <div className="divide-y divide-elite-burgundy/5">
            {orderingPlan.slice(0, 20).map((level) => (
              <div
                key={level.itemId}
                className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-cabin font-medium text-elite-black truncate">
                    {isAr ? level.nameAr : level.name}
                  </div>
                  <div className="text-[11px] font-cabin text-elite-black/45 truncate">
                    {level.preferredSupplier || t("generalSupplier")} ·{" "}
                    {tSections(level.section)}
                  </div>
                  {level.auditWarnings.length > 0 && (
                    <div className="text-[11px] font-cabin text-sky-700 mt-0.5">
                      {level.auditWarnings
                        .map((w) => t(`audit.${w}`))
                        .join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-xs font-cabin text-elite-black/50 text-end">
                  {t("currentVsTarget", {
                    current: level.totalQty,
                    target: level.targetStock,
                  })}
                </div>
                <div className="text-sm font-cabin font-bold text-elite-burgundy text-end">
                  {level.suggestedOrderQty} {isAr ? level.unitAr : level.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 mb-4">
        <div className="flex items-end justify-between gap-4">
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
        <div className="grid grid-cols-1 min-[760px]:grid-cols-[160px_180px_auto_auto] gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-elite-burgundy/15 rounded-xl text-sm font-cabin"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="empty">{t("status.empty")}</option>
            <option value="order_now">{t("status.order_now")}</option>
            <option value="backup_order">{t("status.backup_order")}</option>
            <option value="warning">{t("status.warning")}</option>
            <option value="bar_empty">{t("status.bar_empty")}</option>
            <option value="audit">{t("auditFilter")}</option>
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-elite-burgundy/15 rounded-xl text-sm font-cabin"
          >
            <option value="">{t("allSuppliers")}</option>
            {stockData?.suppliers.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>
          <label className="h-10 flex items-center gap-2 px-3 bg-white border border-elite-burgundy/15 rounded-xl text-sm font-cabin text-elite-black/70">
            <input
              type="checkbox"
              checked={actionableOnly}
              onChange={(e) => setActionableOnly(e.target.checked)}
            />
            {t("actionableOnly")}
          </label>
          <label className="h-10 flex items-center gap-2 px-3 bg-white border border-elite-burgundy/15 rounded-xl text-sm font-cabin text-elite-black/70">
            <input
              type="checkbox"
              checked={missingMinimumOnly}
              onChange={(e) => setMissingMinimumOnly(e.target.checked)}
            />
            {t("missingMinimumOnly")}
          </label>
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
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40 hidden min-[760px]:table-cell">
                  {t("suggestedOrder")}
                </th>
                <th className="text-center px-3 py-3 text-[11px] uppercase tracking-wider font-medium text-elite-black/40 hidden min-[900px]:table-cell">
                  {t("daysRemaining")}
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
                      level.totalStatus === "backup_order" &&
                        "bg-fuchsia-50/30",
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
                    <td className="text-center px-3 py-2.5 font-medium text-elite-burgundy hidden min-[760px]:table-cell">
                      {level.suggestedOrderQty > 0
                        ? `${level.suggestedOrderQty} ${isAr ? level.unitAr : level.unit}`
                        : "—"}
                    </td>
                    <td className="text-center px-3 py-2.5 text-elite-black/50 hidden min-[900px]:table-cell">
                      {level.daysRemaining !== null ? level.daysRemaining : "—"}
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
                      {level.statusReason === "backup_threshold" && (
                        <div className="text-[11px] text-fuchsia-700 mt-1">
                          {t("backupHint", {
                            threshold: level.fallbackThreshold,
                          })}
                        </div>
                      )}
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
