"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { PAYMENT_METHODS, DEFAULT_SUPPLIERS } from "@/lib/inventory/constants";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { cn } from "@/lib/utils";

interface PurchaseEntryDraft {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseRecord {
  id: string;
  date: string;
  supplierName: string;
  paymentMethod: string;
  receiptStatus: string;
  totalAmount: number;
  entries: Array<{
    item: { name: string; nameAr: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
}

export default function PurchasePage() {
  const locale = useLocale();
  const t = useTranslations("admin.purchase");
  const tCommon = useTranslations("admin.common");
  const isAr = locale === "ar";

  const { items, loading: itemsLoading } = useInventoryItems();
  const [supplierKey, setSupplierKey] = useState("");
  const [customSupplierName, setCustomSupplierName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const isNewSupplier = supplierKey === "_new";
  const supplierName = isNewSupplier ? customSupplierName : supplierKey;
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<PurchaseEntryDraft[]>([
    { itemId: "", quantity: 0, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [receiving, setReceiving] = useState<string | null>(null);

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: isAr ? item.nameAr : item.name,
      })),
    [items, isAr],
  );

  const paymentOptions = useMemo(
    () =>
      PAYMENT_METHODS.map((pm) => ({
        value: pm,
        label: t(`paymentMethods.${pm}`),
      })),
    [t],
  );

  const supplierOptions = useMemo(() => {
    const presets = DEFAULT_SUPPLIERS.map((key) => ({
      value: t(`suppliers.${key}`),
      label: t(`suppliers.${key}`),
    }));
    return [...presets, { value: "_new", label: `+ ${t("newSupplier")}` }];
  }, [t]);

  useEffect(() => {
    fetch("/api/admin/purchases")
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          setPurchases(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const updateEntry = useCallback(
    (idx: number, field: keyof PurchaseEntryDraft, value: string | number) => {
      setEntries((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
      );
    },
    [],
  );

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { itemId: "", quantity: 0, unitPrice: 0 }]);
  }, []);

  const removeEntry = useCallback((idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const totalAmount = entries.reduce(
    (sum, e) => sum + e.quantity * e.unitPrice,
    0,
  );

  const handleSave = useCallback(async () => {
    const validEntries = entries.filter((e) => e.itemId && e.quantity > 0);
    if (!supplierName || validEntries.length === 0) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName,
          paymentMethod,
          notes: notes || undefined,
          entries: validEntries,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      setMessage({ type: "success", text: t("saved") });
      setSupplierKey("");
      setCustomSupplierName("");
      setNotes("");
      setEntries([{ itemId: "", quantity: 0, unitPrice: 0 }]);

      const updated = await fetch("/api/admin/purchases");
      if (updated.ok) {
        const json = await updated.json();
        setPurchases(json.data);
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }, [supplierName, paymentMethod, notes, entries, t]);

  const handleReceive = useCallback(
    async (purchaseId: string) => {
      setReceiving(purchaseId);
      try {
        const res = await fetch(`/api/admin/purchases/${purchaseId}/receive`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed");
        }
        setMessage({ type: "success", text: t("received") });

        const updated = await fetch("/api/admin/purchases");
        if (updated.ok) {
          const json = await updated.json();
          setPurchases(json.data);
        }
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Error",
        });
      } finally {
        setReceiving(null);
      }
    },
    [t],
  );

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
        {/* Supplier */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("supplierLabel")}
          </label>
          <SearchableSelect
            value={supplierKey}
            onChange={(val) => {
              setSupplierKey(val);
              if (val !== "_new") setCustomSupplierName("");
            }}
            options={supplierOptions}
            placeholder={t("supplierPlaceholder")}
            searchPlaceholder={tCommon("search")}
          />
          {isNewSupplier && (
            <input
              type="text"
              value={customSupplierName}
              onChange={(e) => setCustomSupplierName(e.target.value)}
              placeholder={t("newSupplierPlaceholder")}
              className="w-full h-12 mt-2 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
              autoFocus
            />
          )}
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("paymentLabel")}
          </label>
          <SearchableSelect
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={paymentOptions}
            searchPlaceholder={tCommon("search")}
          />
        </div>

        {/* Item entries */}
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="p-4 bg-elite-cream/20 rounded-2xl border border-elite-burgundy/8 space-y-3"
            >
              <SearchableSelect
                value={entry.itemId}
                onChange={(v) => updateEntry(idx, "itemId", v)}
                options={itemOptions}
                placeholder={t("itemLabel")}
                searchPlaceholder={tCommon("search")}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-cabin text-elite-black/50 mb-1.5">
                    {t("qtyLabel")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={entry.quantity || ""}
                    onChange={(e) =>
                      updateEntry(idx, "quantity", Number(e.target.value) || 0)
                    }
                    className="w-full h-12 text-center bg-white border border-elite-burgundy/15 rounded-2xl text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-cabin text-elite-black/50 mb-1.5">
                    {t("priceLabel")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={entry.unitPrice || ""}
                    onChange={(e) =>
                      updateEntry(idx, "unitPrice", Number(e.target.value) || 0)
                    }
                    className="w-full h-12 text-center bg-white border border-elite-burgundy/15 rounded-2xl text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
                  />
                </div>
                <div className="flex flex-col items-center justify-end pb-1">
                  <span className="text-sm font-cabin font-medium text-elite-black/70 mb-1">
                    {(entry.quantity * entry.unitPrice).toFixed(0)}
                  </span>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(idx)}
                      className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="w-full h-12 rounded-2xl border border-dashed border-elite-burgundy/20 text-elite-burgundy/60 text-sm font-cabin hover:bg-elite-burgundy/5 transition-colors"
          >
            + {t("addItem")}
          </button>
        </div>

        {totalAmount > 0 && (
          <div className="flex justify-between items-center px-1 pt-2 border-t border-elite-burgundy/10">
            <span className="text-sm font-cabin font-medium text-elite-black/70">
              {t("totalLabel")}
            </span>
            <span className="font-calistoga text-lg text-elite-burgundy">
              {totalAmount.toFixed(0)} EGP
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-cabin text-elite-black/60 mb-2">
            {t("notesLabel")}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            className="w-full h-12 bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20"
          />
        </div>

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
          onClick={handleSave}
          disabled={
            !supplierName ||
            entries.every((e) => !e.itemId || e.quantity <= 0) ||
            saving
          }
          className="w-full h-14 rounded-2xl bg-elite-burgundy text-elite-cream font-cabin text-sm font-medium hover:bg-elite-burgundy/90 disabled:opacity-50 transition-colors"
        >
          {saving ? t("saving") : t("savePurchase")}
        </button>
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="font-calistoga text-lg text-elite-burgundy mb-3">
          {t("history")}
        </h2>
        {purchases.length === 0 ? (
          <p className="text-sm text-elite-black/40 font-cabin">
            {t("noHistory")}
          </p>
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-elite-burgundy/10 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-cabin font-medium text-sm text-elite-black">
                      {p.supplierName}
                    </span>
                    <span className="text-xs text-elite-black/40 ms-2 font-cabin">
                      {new Date(p.createdAt).toLocaleDateString(
                        isAr ? "ar-EG" : "en-US",
                      )}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-cabin",
                      p.receiptStatus === "received"
                        ? "bg-emerald-50 text-emerald-700"
                        : p.receiptStatus === "partial"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-elite-cream text-elite-black/60",
                    )}
                  >
                    {t(`receiptStatus.${p.receiptStatus}`)}
                  </span>
                </div>
                <div className="text-xs text-elite-black/50 font-cabin space-y-0.5 mb-2">
                  {p.entries.map((e, i) => (
                    <div key={i}>
                      {isAr ? e.item.nameAr : e.item.name} ×{" "}
                      {Number(e.quantity)} @ {Number(e.unitPrice)} ={" "}
                      {Number(e.totalPrice)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-cabin text-sm font-medium text-elite-burgundy">
                    {Number(p.totalAmount)} EGP
                  </span>
                  {p.receiptStatus === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleReceive(p.id)}
                      disabled={receiving === p.id}
                      className="h-10 px-4 text-xs font-cabin font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                    >
                      {receiving === p.id ? t("receiving") : t("receiveGoods")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
