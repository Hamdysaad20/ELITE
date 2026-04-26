"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import type { InventoryItem } from "@/hooks/useInventoryItems";
import { QUICK_QUANTITIES } from "@/lib/inventory/constants";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { cn } from "@/lib/utils";

interface TodayTransfer {
  id: string;
  item: { name: string; nameAr: string; unitAr: string };
  totalUnits: number;
  unitUsed: string;
  createdAt: string;
  transferredBy: { name: string | null };
}

const UNIT_OPTIONS: Record<string, { label: string; labelAr: string }> = {
  column: { label: "Column (50)", labelAr: "عمود (٥٠)" },
  piece: { label: "Piece", labelAr: "حبة" },
  bottle: { label: "Bottle", labelAr: "زجاجة" },
  kg: { label: "Kilogram", labelAr: "كيلو" },
  liter: { label: "Liter", labelAr: "لتر" },
  carton: { label: "Carton", labelAr: "كرتونة" },
  can: { label: "Can", labelAr: "علبة" },
  bag: { label: "Bag", labelAr: "كيس" },
  box: { label: "Box", labelAr: "علبة" },
  roll: { label: "Roll", labelAr: "رول" },
  pack: { label: "Pack", labelAr: "باكت" },
  bundle: { label: "Bundle", labelAr: "حزمة" },
  jar: { label: "Jar", labelAr: "برطمان" },
};

function getDefaultUnit(item: InventoryItem): string {
  if (item.countMethod === "column_pair") return "column";
  return item.unit;
}

function getAvailableUnits(item: InventoryItem): string[] {
  const units = [item.unit];
  if (item.countMethod === "column_pair") units.push("column");
  if (item.unit === "piece") units.push("pack");
  return [...new Set(units)];
}

export default function TransferPage() {
  const locale = useLocale();
  const t = useTranslations("admin.transfer");
  const tCommon = useTranslations("admin.common");
  const isAr = locale === "ar";

  const { items, loading: itemsLoading } = useInventoryItems();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [unitUsed, setUnitUsed] = useState("piece");
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [todayTransfers, setTodayTransfers] = useState<TodayTransfer[]>([]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: `${isAr ? item.nameAr : item.name} — ${isAr ? item.unitAr : item.unit}`,
      })),
    [items, isAr],
  );

  const unitOptions = useMemo(() => {
    if (!selectedItem) return [];
    return getAvailableUnits(selectedItem).map((u) => ({
      value: u,
      label: isAr ? UNIT_OPTIONS[u]?.labelAr || u : UNIT_OPTIONS[u]?.label || u,
    }));
  }, [selectedItem, isAr]);

  useEffect(() => {
    fetch("/api/admin/transfers")
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          setTodayTransfers(json.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setUnitUsed(getDefaultUnit(selectedItem));
      setQuantity(0);
    }
  }, [selectedItem]);

  const computedTotal = useCallback(() => {
    if (!selectedItem || quantity <= 0) return 0;
    if (unitUsed === "column") return quantity * selectedItem.packSize;
    return quantity;
  }, [selectedItem, quantity, unitUsed]);

  const handleSubmit = useCallback(async () => {
    if (!selectedItem || quantity <= 0) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        itemId: selectedItemId,
        packsCount: unitUsed === "column" ? quantity : 0,
        quantity: unitUsed !== "column" ? quantity : 0,
        unitUsed,
        note: note || undefined,
      };

      const res = await fetch("/api/admin/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      setMessage({ type: "success", text: t("success") });
      setSelectedItemId("");
      setQuantity(0);
      setNote("");

      const updated = await fetch("/api/admin/transfers");
      if (updated.ok) {
        const json = await updated.json();
        setTodayTransfers(json.data);
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, selectedItemId, quantity, unitUsed, note, t]);

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

        {selectedItem && (
          <>
            <div>
              <label className="block text-sm font-cabin text-elite-black/60 mb-2">
                {t("unitLabel")}
              </label>
              <SearchableSelect
                value={unitUsed}
                onChange={setUnitUsed}
                options={unitOptions}
                searchPlaceholder={tCommon("search")}
              />
            </div>

            <div>
              <label className="block text-sm font-cabin text-elite-black/60 mb-2">
                {t("quantityLabel")}
              </label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.max(
                        0,
                        q -
                          (unitUsed === "kg" || unitUsed === "liter" ? 0.1 : 1),
                      ),
                    )
                  }
                  className="w-12 h-12 rounded-2xl bg-elite-cream/60 border border-elite-burgundy/15 text-elite-burgundy text-xl font-medium flex items-center justify-center hover:bg-elite-cream transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  step={unitUsed === "kg" || unitUsed === "liter" ? 0.1 : 1}
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  className="flex-1 h-12 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-center text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (q) =>
                        q +
                        (unitUsed === "kg" || unitUsed === "liter" ? 0.1 : 1),
                    )
                  }
                  className="w-12 h-12 rounded-2xl bg-elite-cream/60 border border-elite-burgundy/15 text-elite-burgundy text-xl font-medium flex items-center justify-center hover:bg-elite-cream transition-colors"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-elite-black/40 font-cabin self-center me-1">
                  {t("quickQty")}:
                </span>
                {QUICK_QUANTITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={cn(
                      "h-8 min-w-[40px] px-2.5 rounded-lg text-xs font-cabin font-medium transition-colors border",
                      quantity === q
                        ? "bg-elite-burgundy text-elite-cream border-elite-burgundy"
                        : "bg-elite-cream/40 text-elite-black/60 border-elite-burgundy/15 hover:bg-elite-cream",
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
              {computedTotal() > 0 && unitUsed === "column" && (
                <p className="text-xs text-elite-burgundy/70 font-cabin mt-1.5">
                  {t("totalUnits", {
                    count: computedTotal(),
                    unit: isAr ? selectedItem.unitAr : selectedItem.unit,
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-cabin text-elite-black/60 mb-2">
                {t("noteLabel")}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("notePlaceholder")}
                className="w-full h-12 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
              />
            </div>
          </>
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
          disabled={!selectedItem || quantity <= 0 || submitting}
          className="w-full h-14 rounded-2xl bg-elite-burgundy text-elite-cream font-cabin text-sm font-medium hover:bg-elite-burgundy/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? t("confirming") : t("confirm")}
        </button>
      </div>

      {/* Today's transfers */}
      <div className="mt-6">
        <h2 className="font-calistoga text-lg text-elite-burgundy mb-3">
          {t("todayTransfers")}
        </h2>
        {todayTransfers.length === 0 ? (
          <p className="text-sm text-elite-black/40 font-cabin">
            {t("noTransfers")}
          </p>
        ) : (
          <div className="space-y-2">
            {todayTransfers.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between bg-white rounded-2xl border border-elite-burgundy/10 px-4 py-3.5"
              >
                <div className="text-sm font-cabin">
                  <span className="font-medium text-elite-black">
                    {isAr ? tr.item.nameAr : tr.item.name}
                  </span>
                  <span className="text-elite-black/50 ms-2">
                    {Number(tr.totalUnits)}{" "}
                    {isAr ? tr.item.unitAr : tr.unitUsed}
                  </span>
                </div>
                <span className="text-xs text-elite-black/40 font-cabin">
                  {new Date(tr.createdAt).toLocaleTimeString(
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
