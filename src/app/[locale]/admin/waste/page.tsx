"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import {
  WASTE_CATEGORIES,
  WASTE_REASON_PRESETS,
  type WasteCategory,
} from "@/lib/inventory/constants";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { cn } from "@/lib/utils";

interface TodayWaste {
  id: string;
  location: string;
  item: { name: string; nameAr: string; unitAr: string; unit: string };
  quantity: number;
  category: string;
  reason: string;
  createdAt: string;
}

export default function WastePage() {
  const locale = useLocale();
  const t = useTranslations("admin.waste");
  const tLoc = useTranslations("admin.locations");
  const tCommon = useTranslations("admin.common");
  const isAr = locale === "ar";

  const { items, loading: itemsLoading } = useInventoryItems();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [location, setLocation] = useState<"bar" | "storage">("bar");
  const [category, setCategory] = useState<WasteCategory | "">("");
  const [reason, setReason] = useState("");
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [todayWaste, setTodayWaste] = useState<TodayWaste[]>([]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: isAr ? item.nameAr : item.name,
      })),
    [items, isAr],
  );

  const categoryOptions = useMemo(
    () =>
      WASTE_CATEGORIES.map((cat) => ({
        value: cat,
        label: t(`categories.${cat}`),
      })),
    [t],
  );

  const reasonPresets = useMemo(() => {
    if (!category || category === "other") return [];
    return WASTE_REASON_PRESETS[category].map((key) => ({
      value: key,
      label: t(`reasonPresets.${key}`),
    }));
  }, [category, t]);

  const handleCategoryChange = useCallback((val: string) => {
    setCategory(val as WasteCategory | "");
    setReason("");
    setIsCustomReason(false);
    setDetails("");
  }, []);

  useEffect(() => {
    fetch("/api/admin/waste")
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          setTodayWaste(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(async () => {
    const hasReason =
      category === "other" ? reason.length >= 3 : reason.length > 0;
    if (!selectedItemId || quantity <= 0 || !category || !hasReason) return;
    setSubmitting(true);
    setMessage(null);

    const fullReason = details ? `${reason} — ${details}` : reason;

    try {
      const res = await fetch("/api/admin/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItemId,
          quantity,
          location,
          category,
          reason: fullReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      setMessage({ type: "success", text: t("success") });
      setSelectedItemId("");
      setQuantity(0);
      setCategory("");
      setReason("");
      setIsCustomReason(false);
      setDetails("");

      const updated = await fetch("/api/admin/waste");
      if (updated.ok) {
        const json = await updated.json();
        setTodayWaste(json.data);
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedItemId, quantity, location, category, reason, details, t]);

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
      </div>
    );
  }

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

      <div className="bg-white rounded-2xl border border-elite-burgundy/10 p-5 space-y-5">
        {/* Item */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("itemLabel")}
          </label>
          <SearchableSelect
            value={selectedItemId}
            onChange={setSelectedItemId}
            options={itemOptions}
            placeholder={t("itemPlaceholder")}
            searchPlaceholder={tCommon("search")}
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("quantityLabel")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={
                selectedItem?.unit === "kg" || selectedItem?.unit === "liter"
                  ? 0.1
                  : 1
              }
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              className="flex-1 h-12 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
            />
            {selectedItem && (
              <span className="text-sm text-elite-black/50 font-cabin">
                {isAr ? selectedItem.unitAr : selectedItem.unit}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("locationLabel")}
          </label>
          <div className="flex gap-2">
            {(["bar", "storage"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={cn(
                  "flex-1 h-12 rounded-2xl text-sm font-cabin font-medium transition-colors border",
                  location === loc
                    ? "bg-elite-burgundy text-elite-cream border-elite-burgundy"
                    : "bg-elite-cream/40 text-elite-black/60 border-elite-burgundy/15 hover:bg-elite-cream",
                )}
              >
                {tLoc(loc)}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("categoryLabel")}
          </label>
          <SearchableSelect
            value={category}
            onChange={handleCategoryChange}
            options={categoryOptions}
            placeholder="—"
            searchPlaceholder={tCommon("search")}
          />
        </div>

        {/* Reason — preset buttons or free text for "other" */}
        {category && (
          <div>
            <label className="block text-sm font-cabin text-elite-black/60 mb-2">
              {t("reasonLabel")}
            </label>
            {category === "other" || isCustomReason ? (
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="w-full h-12 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {reasonPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setReason(preset.label)}
                    className={cn(
                      "h-10 px-4 rounded-xl text-sm font-cabin font-medium transition-colors border",
                      reason === preset.label
                        ? "bg-elite-burgundy text-elite-cream border-elite-burgundy"
                        : "bg-elite-cream/40 text-elite-black/70 border-elite-burgundy/15 hover:bg-elite-cream",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomReason(true);
                    setReason("");
                  }}
                  className="h-10 px-4 rounded-xl text-sm font-cabin font-medium transition-colors border border-dashed border-elite-burgundy/20 text-elite-black/50 hover:bg-elite-cream/50"
                >
                  {t("customReason")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Optional details */}
        {reason && !isCustomReason && category !== "other" && (
          <div>
            <label className="block text-sm font-cabin text-elite-black/60 mb-2">
              {t("detailsLabel")}
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("detailsPlaceholder")}
              className="w-full h-12 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
            />
          </div>
        )}

        {message && (
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-sm font-cabin",
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200",
            )}
          >
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !selectedItemId ||
            quantity <= 0 ||
            !category ||
            (category === "other" ? reason.length < 3 : !reason) ||
            submitting
          }
          className="w-full h-14 rounded-2xl bg-elite-burgundy text-elite-cream font-cabin text-sm font-medium hover:bg-elite-burgundy/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? t("confirming") : t("confirm")}
        </button>
      </div>

      {/* Today's waste */}
      <div className="mt-6">
        <h2 className="font-calistoga text-lg text-elite-burgundy mb-3">
          {t("todayWaste")}
        </h2>
        {todayWaste.length === 0 ? (
          <p className="text-sm text-elite-black/40 font-cabin">
            {t("noWaste")}
          </p>
        ) : (
          <div className="space-y-2">
            {todayWaste.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-white rounded-2xl border border-elite-burgundy/10 px-4 py-3.5"
              >
                <div className="text-sm font-cabin space-y-0.5">
                  <div>
                    <span className="font-medium text-elite-black">
                      {isAr ? w.item.nameAr : w.item.name}
                    </span>
                    <span className="text-elite-black/50 ms-2">
                      {Number(w.quantity)} {isAr ? w.item.unitAr : w.item.unit}
                    </span>
                  </div>
                  <div className="text-xs text-elite-black/40">
                    {tLoc(w.location as "bar" | "storage")} —{" "}
                    {t(`categories.${w.category}`)}
                  </div>
                </div>
                <span className="text-xs text-elite-black/40 font-cabin">
                  {new Date(w.createdAt).toLocaleTimeString(
                    isAr ? "ar-EG" : "en-US",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
