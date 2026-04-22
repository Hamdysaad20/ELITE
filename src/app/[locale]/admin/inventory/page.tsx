"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { suggestShift } from "@/lib/inventory/constants";
import { cn } from "@/lib/utils";

interface EntryState {
  [itemId: string]: number;
}

export default function BarCountPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("admin.barCount");
  const tSections = useTranslations("admin.sections");
  const tShifts = useTranslations("admin.shifts");
  const isAr = locale === "ar";

  const suggestedShift = suggestShift();
  const { grouped, loading: itemsLoading } = useInventoryItems("bar");
  const [shift, setShift] = useState(suggestedShift);
  const [entries, setEntries] = useState<EntryState>({});
  const [notes, setNotes] = useState("");
  const [shortageNotes, setShortageNotes] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (grouped.length > 0) {
      const mainSections = grouped
        .filter(
          (g) => g.section !== "cleaning_supplies" && g.section !== "other",
        )
        .map((g) => g.section);
      setExpandedSections(new Set(mainSections));
    }
  }, [grouped]);

  useEffect(() => {
    fetch(
      `/api/admin/inventory?location=bar&status=draft&date=${new Date().toISOString().split("T")[0]}`,
    )
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        if (json.data?.length > 0) {
          const draft = json.data[0];
          if (draft.status === "submitted") {
            setIsSubmitted(true);
            return;
          }
          const restored: EntryState = {};
          for (const entry of draft.entries) {
            restored[entry.itemId] =
              Number(entry.quantity) || Number(entry.totalQuantity);
          }
          setEntries(restored);
          setNotes(draft.notes || "");
          setShortageNotes(draft.shortageNotes || "");
          setShift(draft.shiftConfirmed);
          setMessage({ type: "success", text: t("existingDraft") });
        }
      })
      .catch(() => {});
  }, [t]);

  const updateEntry = useCallback((itemId: string, value: number) => {
    setEntries((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const buildPayload = useCallback(
    (submit: boolean) => {
      const entryList = Object.entries(entries)
        .filter(([, v]) => v > 0)
        .map(([itemId, qty]) => ({
          itemId,
          quantity: qty,
          packsCount: 0,
          looseSingles: 0,
        }));

      return {
        location: "bar",
        shiftConfirmed: shift,
        entries: entryList,
        notes: notes || undefined,
        shortageNotes: shortageNotes || undefined,
        submit,
      };
    },
    [entries, shift, notes, shortageNotes],
  );

  const handleSave = useCallback(async () => {
    const payload = buildPayload(false);
    if (payload.entries.length === 0) {
      setMessage({ type: "error", text: t("noDraftChanges") });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      setMessage({ type: "success", text: t("draftSaved") });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }, [buildPayload, t]);

  const handleSubmit = useCallback(async () => {
    const payload = buildPayload(true);
    if (payload.entries.length === 0) {
      setMessage({ type: "error", text: t("noDraftChanges") });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      setMessage({ type: "success", text: t("submitted") });
      setIsSubmitted(true);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, t]);

  const today = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-calistoga text-xl text-elite-burgundy mb-2">
          {t("submitted")}
        </h2>
        <p className="text-sm text-elite-black/60 font-cabin mb-6">
          {t("submitWarning")}
        </p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin`)}
          className="h-12 px-6 rounded-2xl bg-elite-burgundy text-elite-cream font-cabin text-sm font-medium hover:bg-elite-burgundy/90 transition-colors"
        >
          {t("goHome")}
        </button>
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

      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white rounded-2xl border border-elite-burgundy/10">
        <div className="flex items-center gap-2 text-sm font-cabin">
          <span className="text-elite-black/50">{t("dateLabel")}:</span>
          <span className="font-medium text-elite-black">{today}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-cabin">
            <span className="text-elite-black/50">{t("shiftLabel")}:</span>
            <select
              value={shift}
              onChange={(e) =>
                setShift(e.target.value as "morning" | "evening")
              }
              className={cn(
                "h-12 border rounded-2xl px-4 text-sm font-cabin focus:outline-none focus:ring-2",
                shift !== suggestedShift
                  ? "bg-amber-50 border-amber-300 focus:ring-amber-200"
                  : "bg-elite-cream/50 border-elite-burgundy/15 focus:ring-elite-burgundy/20",
              )}
            >
              <option value="morning">{tShifts("morning")}</option>
              <option value="evening">{tShifts("evening")}</option>
            </select>
          </div>
          {shift !== suggestedShift && (
            <span className="text-xs font-cabin text-amber-600 flex items-center gap-1">
              ⚠️ {t("shiftOverrideWarning")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-cabin">
          <span className="text-elite-black/50">{t("responsibleLabel")}:</span>
          <span className="font-medium text-elite-black">
            {session?.user?.name || session?.user?.email}
          </span>
        </div>
      </div>

      <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3">
          {grouped.map((group) => {
            const isExpanded = expandedSections.has(group.section);
            const filledCount = group.items.filter(
              (item) => (entries[item.id] || 0) > 0,
            ).length;

            return (
              <div
                key={group.section}
                className="bg-white rounded-2xl border border-elite-burgundy/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(group.section)}
                  className="w-full flex items-center justify-between px-4 py-3 text-start hover:bg-elite-cream/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-calistoga text-sm text-elite-burgundy">
                      {tSections(group.section)}
                    </span>
                    {filledCount > 0 && (
                      <span className="bg-elite-burgundy/10 text-elite-burgundy text-xs px-2 py-0.5 rounded-full font-cabin">
                        {filledCount}/{group.items.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={cn(
                      "w-4 h-4 text-elite-black/40 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2 border-t border-elite-burgundy/5 first:border-0"
                      >
                        <span className="text-sm font-cabin text-elite-black/80 flex-1 min-w-0 truncate">
                          {isAr ? item.nameAr : item.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={0}
                            step={
                              item.unit === "kg" || item.unit === "liter"
                                ? 0.1
                                : 1
                            }
                            value={entries[item.id] ?? ""}
                            onChange={(e) =>
                              updateEntry(item.id, Number(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-[72px] h-12 text-center text-sm font-cabin bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20 focus:border-elite-burgundy/30"
                          />
                          <span className="text-xs text-elite-black/40 font-cabin w-10">
                            {isAr ? item.unitAr : item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-white rounded-2xl border border-elite-burgundy/10 p-4">
            <label className="block text-sm font-cabin text-elite-black/60 mb-1.5">
              {t("shortageNotes")}
            </label>
            <textarea
              value={shortageNotes}
              onChange={(e) => setShortageNotes(e.target.value)}
              rows={2}
              className="w-full text-sm font-cabin bg-elite-cream/30 border border-elite-burgundy/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20 resize-none"
            />
          </div>
          <div className="bg-white rounded-2xl border border-elite-burgundy/10 p-4">
            <label className="block text-sm font-cabin text-elite-black/60 mb-1.5">
              {t("wasteNotes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-sm font-cabin bg-elite-cream/30 border border-elite-burgundy/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20 resize-none"
            />
          </div>
        </div>

        {message && (
          <div
            className={cn(
              "mt-4 px-4 py-3 rounded-2xl text-sm font-cabin",
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200",
            )}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || submitting}
            className="flex-1 h-14 rounded-2xl border border-elite-burgundy/20 text-elite-burgundy font-cabin text-sm font-medium hover:bg-elite-burgundy/5 disabled:opacity-50 transition-colors"
          >
            {saving ? t("saving") : t("saveDraft")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || submitting}
            className="flex-1 h-14 rounded-2xl bg-elite-burgundy text-elite-cream font-cabin text-sm font-medium hover:bg-elite-burgundy/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>

        <p className="text-center text-xs text-elite-black/40 font-cabin mt-2">
          ⚠️ {t("submitWarning")}
        </p>
      </form>
    </div>
  );
}
