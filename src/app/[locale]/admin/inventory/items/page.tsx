"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { DEFAULT_SUPPLIERS } from "@/lib/inventory/constants";
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
  const tPurchase = useTranslations("admin.purchase");
  const tSections = useTranslations("admin.sections");
  const isAr = locale === "ar";
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  const canEdit = role === "admin" || role === "manager";

  const { grouped, loading, reload } = useInventoryItems();
  const [search, setSearch] = useState("");
  const [onlyMissingMinimum, setOnlyMissingMinimum] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    minimumStock: "",
    alertLevel: "",
    maximumStock: "",
    backupThreshold: "",
    preferredSupplier: "",
    reason: "",
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return grouped
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const matchesSearch =
            !search.trim() ||
            item.name.toLowerCase().includes(q) ||
            item.nameAr.includes(q);
          const matchesMinimum = !onlyMissingMinimum || item.minimumStock <= 0;
          const matchesSupplier =
            !supplierFilter || item.preferredSupplier === supplierFilter;
          return matchesSearch && matchesMinimum && matchesSupplier;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [grouped, search, onlyMissingMinimum, supplierFilter]);

  const supplierOptions = useMemo(
    () => [
      ...DEFAULT_SUPPLIERS.map((key) => ({
        value: tPurchase(`suppliers.${key}`),
        label: tPurchase(`suppliers.${key}`),
      })),
      ...Array.from(
        new Set(
          grouped.flatMap((g) =>
            g.items
              .map((item) => item.preferredSupplier)
              .filter((value): value is string => Boolean(value)),
          ),
        ),
      )
        .filter(
          (supplier) =>
            !DEFAULT_SUPPLIERS.some(
              (key) => tPurchase(`suppliers.${key}`) === supplier,
            ),
        )
        .map((supplier) => ({ value: supplier, label: supplier })),
    ],
    [grouped, tPurchase],
  );

  const missingMinimumCount = useMemo(
    () =>
      grouped.reduce(
        (sum, group) =>
          sum + group.items.filter((item) => item.minimumStock <= 0).length,
        0,
      ),
    [grouped],
  );

  const startEdit = (item: {
    id: string;
    minimumStock: number;
    alertLevel: number;
    maximumStock: number;
    backupThreshold: number;
    preferredSupplier: string | null;
  }) => {
    setEditingId(item.id);
    setDraft({
      minimumStock: String(item.minimumStock),
      alertLevel: String(item.alertLevel),
      maximumStock: String(item.maximumStock),
      backupThreshold: String(item.backupThreshold),
      preferredSupplier: item.preferredSupplier ?? "",
      reason: "",
    });
  };

  const saveItem = async (itemId: string) => {
    setSavingId(itemId);
    try {
      const response = await fetch("/api/admin/inventory-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          minimumStock: Number(draft.minimumStock || 0),
          alertLevel: Number(draft.alertLevel || 0),
          maximumStock: Number(draft.maximumStock || 0),
          backupThreshold: Number(draft.backupThreshold || 0),
          preferredSupplier: draft.preferredSupplier || null,
          reason: draft.reason || undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to save item");
      setEditingId(null);
      reload();
    } finally {
      setSavingId(null);
    }
  };

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

      <div className="grid gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div className="text-sm font-cabin font-medium text-amber-800">
            {t("missingMinimumTask", { count: missingMinimumCount })}
          </div>
          <div className="text-xs font-cabin text-amber-700 mt-0.5">
            {t("missingMinimumTaskDesc")}
          </div>
        </div>

        <div className="grid grid-cols-1 min-[680px]:grid-cols-[1fr_180px_auto] gap-2">
          <div className="relative">
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
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-11 px-3 bg-white border border-elite-burgundy/15 rounded-2xl text-sm font-cabin"
          >
            <option value="">{t("allSuppliers")}</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.value} value={supplier.value}>
                {supplier.label}
              </option>
            ))}
          </select>
          <label className="h-11 flex items-center gap-2 px-3 bg-white border border-elite-burgundy/15 rounded-2xl text-sm font-cabin text-elite-black/70">
            <input
              type="checkbox"
              checked={onlyMissingMinimum}
              onChange={(e) => setOnlyMissingMinimum(e.target.checked)}
            />
            {t("missingOnly")}
          </label>
        </div>
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
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 border-b border-elite-burgundy/5 text-xs font-cabin text-elite-black/40">
              <span>{t("name")}</span>
              <span className="w-12 text-center">{t("unit")}</span>
              <span className="w-12 text-center hidden min-[420px]:block">
                {t("locations")}
              </span>
              <span className="w-16 text-center">{t("minStock")}</span>
              <span className="w-16 text-center">{t("backupThreshold")}</span>
            </div>

            {/* Items */}
            {group.items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="border-b border-elite-burgundy/5 last:border-0 hover:bg-elite-cream/20 transition-colors"
                >
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => canEdit && startEdit(item)}
                      className="text-sm font-cabin text-elite-black truncate text-start"
                    >
                      {isAr ? item.nameAr : item.name}
                      {item.preferredSupplier && (
                        <span className="block text-[11px] text-elite-black/40 truncate">
                          {item.preferredSupplier}
                        </span>
                      )}
                    </button>

                    <span className="w-12 text-center text-xs font-cabin text-elite-black/50 bg-elite-cream/60 px-1.5 py-0.5 rounded-lg">
                      {isAr ? item.unitAr : item.unit}
                    </span>

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

                    <div className="w-16 flex items-center justify-center gap-1.5">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          item.minimumStock > 0
                            ? STATUS_DOT.ok
                            : "bg-amber-400",
                        )}
                      />
                      <span className="text-xs font-cabin text-elite-black/60">
                        {item.minimumStock > 0 ? item.minimumStock : "—"}
                      </span>
                    </div>

                    <div className="w-16 text-center text-xs font-cabin text-fuchsia-700">
                      {item.backupThreshold}
                    </div>
                  </div>

                  {editingId === item.id && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-2 min-[680px]:grid-cols-5 gap-2 bg-elite-cream/40 rounded-xl p-3">
                        {[
                          ["minimumStock", t("minStock")],
                          ["alertLevel", t("alertLevel")],
                          ["maximumStock", t("targetStock")],
                          ["backupThreshold", t("backupThreshold")],
                        ].map(([key, label]) => (
                          <label
                            key={key}
                            className="text-[11px] font-cabin text-elite-black/50"
                          >
                            {label}
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft[key as keyof typeof draft]}
                              onChange={(e) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="mt-1 w-full h-9 px-2 rounded-lg border border-elite-burgundy/15 bg-white text-sm text-elite-black"
                            />
                          </label>
                        ))}
                        <label className="text-[11px] font-cabin text-elite-black/50">
                          {t("supplier")}
                          <input
                            value={draft.preferredSupplier}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                preferredSupplier: e.target.value,
                              }))
                            }
                            className="mt-1 w-full h-9 px-2 rounded-lg border border-elite-burgundy/15 bg-white text-sm text-elite-black"
                            list="supplier-list"
                          />
                        </label>
                        <label className="text-[11px] font-cabin text-elite-black/50 min-[680px]:col-span-5">
                          {t("changeReason")}
                          <input
                            value={draft.reason}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                reason: e.target.value,
                              }))
                            }
                            className="mt-1 w-full h-9 px-2 rounded-lg border border-elite-burgundy/15 bg-white text-sm text-elite-black"
                          />
                        </label>
                      </div>
                      {item.ruleChangeLogs &&
                        item.ruleChangeLogs.length > 0 && (
                          <div className="mt-2 rounded-xl border border-elite-burgundy/8 bg-white px-3 py-2">
                            <div className="text-[11px] font-cabin font-medium text-elite-burgundy mb-1">
                              {t("recentChanges")}
                            </div>
                            <div className="space-y-1">
                              {item.ruleChangeLogs.map((change) => (
                                <div
                                  key={change.id}
                                  className="text-[11px] font-cabin text-elite-black/55"
                                >
                                  <span className="font-medium text-elite-black/70">
                                    {change.field}
                                  </span>
                                  : {change.oldValue || "—"} →{" "}
                                  {change.newValue || "—"}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      <datalist id="supplier-list">
                        {supplierOptions.map((supplier) => (
                          <option key={supplier.value} value={supplier.value} />
                        ))}
                      </datalist>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-9 px-3 rounded-lg border border-elite-burgundy/10 bg-white text-xs font-cabin text-elite-black/60"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={() => saveItem(item.id)}
                          disabled={savingId === item.id}
                          className="h-9 px-3 rounded-lg bg-elite-burgundy text-white text-xs font-cabin disabled:opacity-50"
                        >
                          {savingId === item.id ? t("saving") : t("save")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
