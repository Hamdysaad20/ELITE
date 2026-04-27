"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Tab = "counts" | "transfers" | "waste";
type ViewMode = "day" | "week" | "month";

interface CountEntry {
  id: string;
  location: string;
  shiftConfirmed: string;
  countType: string;
  status: string;
  notes: string | null;
  shortageNotes: string | null;
  countedBy: { name: string | null; email: string };
  entries: Array<{ itemId: string; totalQuantity: number }>;
  submittedAt: string | null;
  createdAt: string;
  overwriteLogs?: Array<{
    id: string;
    reason: string | null;
    createdAt: string;
    overwrittenBy: { name: string | null; email: string };
  }>;
}

interface TransferEntry {
  id: string;
  item: { name: string; nameAr: string; unit: string; unitAr: string };
  totalUnits: number;
  unitUsed: string;
  note: string | null;
  transferredBy: { name: string | null };
  createdAt: string;
}

interface WasteEntry {
  id: string;
  location: string;
  item: { name: string; nameAr: string; unit: string; unitAr: string };
  quantity: number;
  category: string;
  reason: string;
  recordedBy?: { name: string | null };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-elite-cream text-elite-black/60",
  submitted: "bg-blue-50 text-blue-700",
  reviewed: "bg-emerald-50 text-emerald-700",
  flagged: "bg-amber-50 text-amber-700",
};

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtTime(iso: string, loc: string) {
  return new Date(iso).toLocaleTimeString(loc === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeekDays(dateStr: string): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const sat = new Date(d);
  sat.setDate(d.getDate() - ((day + 1) % 7));
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(sat);
    dd.setDate(sat.getDate() + i);
    days.push(toDateStr(dd));
  }
  return days;
}

function getMonthDays(dateStr: string): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  const days: string[] = [];
  for (let i = 1; i <= last; i++) {
    days.push(toDateStr(new Date(year, month, i)));
  }
  return days;
}

export default function HistoryPage() {
  const locale = useLocale();
  const t = useTranslations("admin.history");
  const tLoc = useTranslations("admin.locations");
  const tShifts = useTranslations("admin.shifts");
  const tWaste = useTranslations("admin.waste");
  const isAr = locale === "ar";

  const [tab, setTab] = useState<Tab>("counts");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [date, setDate] = useState(toDateStr(new Date()));
  const [counts, setCounts] = useState<CountEntry[]>([]);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [waste, setWaste] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const [barRes, storageRes, trRes, wRes] = await Promise.all([
        fetch(`/api/admin/inventory?location=bar&date=${d}`).then((r) =>
          r.json(),
        ),
        fetch(`/api/admin/inventory?location=storage&date=${d}`).then((r) =>
          r.json(),
        ),
        fetch(`/api/admin/transfers?date=${d}`).then((r) => r.json()),
        fetch(`/api/admin/waste?date=${d}`).then((r) => r.json()),
      ]);
      setCounts([...(barRes.data || []), ...(storageRes.data || [])]);
      setTransfers(trRes.data || []);
      setWaste(wRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const todayStr = toDateStr(new Date());

  const navigate = (dir: -1 | 1) => {
    const d = new Date(date + "T12:00:00");
    if (viewMode === "day") {
      d.setDate(d.getDate() + dir);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setMonth(d.getMonth() + dir);
    }
    const next = toDateStr(d);
    if (next <= todayStr) setDate(next);
  };

  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const monthDays = useMemo(() => getMonthDays(date), [date]);

  const headerLabel = useMemo(() => {
    const d = new Date(date + "T12:00:00");
    const loc = isAr ? "ar-EG" : "en-US";
    if (viewMode === "day") {
      return d.toLocaleDateString(loc, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    if (viewMode === "week") {
      const first = new Date(weekDays[0] + "T12:00:00");
      const last = new Date(weekDays[6] + "T12:00:00");
      return `${first.toLocaleDateString(loc, { month: "short", day: "numeric" })} – ${last.toLocaleDateString(loc, { month: "short", day: "numeric" })}`;
    }
    return d.toLocaleDateString(loc, { month: "long", year: "numeric" });
  }, [date, viewMode, weekDays, isAr]);

  const isToday = date === todayStr;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "counts", label: t("tabs.counts"), count: counts.length },
    { key: "transfers", label: t("tabs.transfers"), count: transfers.length },
    { key: "waste", label: t("tabs.waste"), count: waste.length },
  ];

  const viewModes: { key: ViewMode; label: string }[] = [
    { key: "day", label: t("viewMode.day") },
    { key: "week", label: t("viewMode.week") },
    { key: "month", label: t("viewMode.month") },
  ];

  const dayNames = useMemo(() => {
    const loc = isAr ? "ar-EG" : "en-US";
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 0, 3 + i);
      return d.toLocaleDateString(loc, { weekday: "narrow" });
    });
  }, [isAr]);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="mb-6">
        <h1 className="font-calistoga text-2xl text-elite-burgundy mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-elite-black/60 font-cabin">
          {t("subtitle")}
        </p>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 mb-4 bg-white rounded-2xl border border-elite-burgundy/10 p-1.5">
        {viewModes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setViewMode(key)}
            className={cn(
              "flex-1 h-10 rounded-xl text-sm font-cabin font-medium transition-colors",
              viewMode === key
                ? "bg-elite-burgundy text-elite-cream"
                : "text-elite-black/50 hover:bg-elite-cream/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-2xl border border-elite-burgundy/10 px-3 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-elite-cream/60 text-elite-burgundy transition-colors touch-manipulation"
          aria-label={t("prevDay")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d={isAr ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>
        <div className="text-center">
          <p className="font-calistoga text-base text-elite-burgundy">
            {headerLabel}
          </p>
          {isToday && (
            <span className="text-xs font-cabin text-elite-burgundy/60">
              {t("today")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(1)}
          disabled={
            viewMode === "day"
              ? isToday
              : viewMode === "week"
                ? weekDays[6] >= todayStr
                : monthDays[monthDays.length - 1] >= todayStr
          }
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-elite-cream/60 text-elite-burgundy disabled:opacity-30 transition-colors touch-manipulation"
          aria-label={t("nextDay")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d={isAr ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
          </svg>
        </button>
      </div>

      {/* Week day pills */}
      {viewMode === "week" && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {weekDays.map((d) => {
            const dd = new Date(d + "T12:00:00");
            const isSel = d === date;
            const isFuture = d > todayStr;
            return (
              <button
                key={d}
                type="button"
                disabled={isFuture}
                onClick={() => setDate(d)}
                className={cn(
                  "flex-1 min-w-[44px] h-14 flex flex-col items-center justify-center rounded-2xl text-xs font-cabin transition-colors",
                  isSel
                    ? "bg-elite-burgundy text-elite-cream"
                    : isFuture
                      ? "text-elite-black/20"
                      : "bg-white border border-elite-burgundy/10 text-elite-black/70 hover:bg-elite-cream/60",
                )}
              >
                <span className="font-medium">
                  {dd.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                    weekday: "narrow",
                  })}
                </span>
                <span
                  className={cn(
                    "text-[11px]",
                    isSel ? "text-elite-cream/80" : "text-elite-black/40",
                  )}
                >
                  {dd.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Month calendar grid */}
      {viewMode === "month" && (
        <div className="mb-4 bg-white rounded-2xl border border-elite-burgundy/10 p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((name, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-cabin text-elite-black/40 py-1"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const first = new Date(monthDays[0] + "T12:00:00");
              const startDay = (first.getDay() + 1) % 7;
              const blanks = Array.from({ length: startDay }, (_, i) => (
                <div key={`b${i}`} />
              ));
              const cells = monthDays.map((d) => {
                const dd = new Date(d + "T12:00:00");
                const isSel = d === date;
                const isFuture = d > todayStr;
                const isT = d === todayStr;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={isFuture}
                    onClick={() => setDate(d)}
                    className={cn(
                      "h-9 rounded-xl text-xs font-cabin transition-colors",
                      isSel
                        ? "bg-elite-burgundy text-elite-cream font-medium"
                        : isT
                          ? "bg-elite-burgundy/10 text-elite-burgundy font-medium"
                          : isFuture
                            ? "text-elite-black/20"
                            : "text-elite-black/70 hover:bg-elite-cream/60",
                    )}
                  >
                    {dd.getDate()}
                  </button>
                );
              });
              return [...blanks, ...cells];
            })()}
          </div>
        </div>
      )}

      {/* Data tabs */}
      <div className="flex gap-1.5 mb-4 bg-white rounded-2xl border border-elite-burgundy/10 p-1.5">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 h-11 rounded-xl text-sm font-cabin font-medium transition-colors flex items-center justify-center gap-1.5",
              tab === key
                ? "bg-elite-burgundy text-elite-cream"
                : "text-elite-black/60 hover:bg-elite-cream/60",
            )}
          >
            {label}
            {count > 0 && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  tab === key
                    ? "bg-white/20"
                    : "bg-elite-burgundy/10 text-elite-burgundy",
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {tab === "counts" && (
            <div className="space-y-3">
              {counts.length === 0 ? (
                <p className="text-sm text-elite-black/40 font-cabin text-center py-12">
                  {t("noData")}
                </p>
              ) : (
                counts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-elite-burgundy/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-cabin font-medium text-elite-black">
                          {tLoc(c.location as "bar" | "storage")}
                        </span>
                        <span className="text-xs font-cabin text-elite-black/50">
                          ·
                        </span>
                        <span className="text-xs font-cabin text-elite-black/60">
                          {tShifts(c.shiftConfirmed as "morning" | "evening")}
                        </span>
                        <span className="text-xs font-cabin text-elite-black/50">
                          ·
                        </span>
                        <span className="text-xs font-cabin text-elite-black/60">
                          {c.countedBy.name || c.countedBy.email}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-cabin shrink-0",
                          STATUS_COLORS[c.status] ||
                            "bg-elite-cream text-elite-black/60",
                        )}
                      >
                        {t(`status.${c.status}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-cabin text-elite-black/50">
                          {t("itemCount", { count: c.entries.length })}
                        </span>
                        {(c.overwriteLogs?.length || 0) > 0 && (
                          <span className="text-[11px] font-cabin px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            ↺ {c.overwriteLogs?.length}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-cabin text-elite-black/40">
                        {fmtTime(c.createdAt, locale)}
                      </span>
                    </div>
                    {c.shortageNotes && (
                      <p className="mt-2 text-xs font-cabin text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                        {c.shortageNotes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "transfers" && (
            <div className="space-y-2">
              {transfers.length === 0 ? (
                <p className="text-sm text-elite-black/40 font-cabin text-center py-12">
                  {t("noData")}
                </p>
              ) : (
                transfers.map((tr) => (
                  <div
                    key={tr.id}
                    className="flex items-center justify-between bg-white rounded-2xl border border-elite-burgundy/10 px-4 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-cabin font-medium text-elite-black">
                        {isAr ? tr.item.nameAr : tr.item.name}
                      </p>
                      <p className="text-xs font-cabin text-elite-black/50 mt-0.5">
                        +{Number(tr.totalUnits)}{" "}
                        {isAr ? tr.item.unitAr : tr.item.unit}
                        {tr.transferredBy?.name && (
                          <> · {tr.transferredBy.name}</>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-cabin text-elite-black/40">
                      {fmtTime(tr.createdAt, locale)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "waste" && (
            <div className="space-y-2">
              {waste.length === 0 ? (
                <p className="text-sm text-elite-black/40 font-cabin text-center py-12">
                  {t("noData")}
                </p>
              ) : (
                waste.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between bg-white rounded-2xl border border-elite-burgundy/10 px-4 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-cabin font-medium text-elite-black">
                        {isAr ? w.item.nameAr : w.item.name}
                      </p>
                      <p className="text-xs font-cabin text-elite-black/50 mt-0.5">
                        {Number(w.quantity)}{" "}
                        {isAr ? w.item.unitAr : w.item.unit} ·{" "}
                        {tWaste(`categories.${w.category}`)} ·{" "}
                        {tLoc(w.location as "bar" | "storage")}
                      </p>
                    </div>
                    <span className="text-xs font-cabin text-elite-black/40">
                      {fmtTime(w.createdAt, locale)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
