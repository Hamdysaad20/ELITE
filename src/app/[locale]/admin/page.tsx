"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface OrderNowItem {
  itemId: string;
  name: string;
  nameAr: string;
  unit: string;
  unitAr: string;
  totalQty: number;
  minimumStock: number;
  totalStatus: "order_now" | "empty" | "warning";
}

interface HomeData {
  orderNow: OrderNowItem[];
  pendingReceipts: number;
  openDrafts: number;
  todayWaste: number;
  hasBarCount: boolean;
}

export default function AdminHomePage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations("admin.home");
  const router = useRouter();
  const isAr = locale === "ar";
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  const isManager = role === "admin" || role === "manager";

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "";

  useEffect(() => {
    if (!role) return;
    const today = new Date().toISOString().split("T")[0];

    const stockFetch = isManager
      ? fetch("/api/admin/stock").then((r) =>
          r.ok ? r.json() : { success: false },
        )
      : Promise.resolve({ success: false });
    const purchasesFetch = isManager
      ? fetch("/api/admin/purchases").then((r) =>
          r.ok ? r.json() : { data: [] },
        )
      : Promise.resolve({ data: [] });

    Promise.all([
      stockFetch,
      purchasesFetch,
      fetch(`/api/admin/inventory?location=bar&date=${today}`).then((r) =>
        r.ok ? r.json() : { data: [] },
      ),
      fetch("/api/admin/waste").then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([stockRes, purchasesRes, countsRes, wasteRes]) => {
        const alerts: OrderNowItem[] =
          stockRes.success && stockRes.data?.alerts
            ? stockRes.data.alerts
                .filter(
                  (a: OrderNowItem) =>
                    a.totalStatus === "order_now" || a.totalStatus === "empty",
                )
                .slice(0, 15)
            : [];

        const pendingReceipts = (purchasesRes.data || []).filter(
          (p: { receiptStatus: string }) => p.receiptStatus === "pending",
        ).length;

        const counts = countsRes.data || [];
        const hasBarCount = counts.some(
          (c: { status: string }) => c.status === "submitted",
        );
        const openDrafts = counts.filter(
          (c: { status: string }) => c.status === "draft",
        ).length;

        setData({
          orderNow: alerts,
          pendingReceipts,
          openDrafts,
          todayWaste: (wasteRes.data || []).length,
          hasBarCount,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [role, isManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  const actions: Array<{
    key: string;
    icon: string;
    label: string;
    desc: string;
    urgent: boolean;
  }> = [];

  if (data && !data.hasBarCount) {
    actions.push({
      key: "barCount",
      icon: "📋",
      label: t("noBarCount"),
      desc: t("noBarCountDesc"),
      urgent: true,
    });
  }
  if (isManager && data && data.pendingReceipts > 0) {
    actions.push({
      key: "receipts",
      icon: "📦",
      label: t("pendingReceipts"),
      desc: t("pendingReceiptsDesc", { count: data.pendingReceipts }),
      urgent: false,
    });
  }
  if (data && data.openDrafts > 0) {
    actions.push({
      key: "drafts",
      icon: "📝",
      label: t("openDrafts"),
      desc: t("openDraftsDesc", { count: data.openDrafts }),
      urgent: false,
    });
  }

  const quickLinks = [
    {
      label: t("barCount"),
      icon: "📋",
      href: `/${locale}/admin/inventory`,
    },
    {
      label: t("transfer"),
      icon: "🔄",
      href: `/${locale}/admin/inventory/transfer`,
    },
    {
      label: t("logWaste"),
      icon: "🗑️",
      href: `/${locale}/admin/waste`,
    },
    ...(role === "head_barista"
      ? [
          {
            label: t("storageCount"),
            icon: "📦",
            href: `/${locale}/admin/inventory/storage`,
          },
        ]
      : isManager
        ? [
            {
              label: t("viewDashboard"),
              icon: "📊",
              href: `/${locale}/admin/dashboard`,
            },
          ]
        : []),
  ];

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-calistoga text-2xl text-elite-burgundy">
          {t("greeting", { name: userName })}
        </h1>
        <p className="text-sm text-elite-black/50 font-cabin mt-0.5">
          {new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Order Now — the critical section */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🚨</span>
          <h2 className="font-calistoga text-base text-elite-burgundy">
            {t("orderNow")}
          </h2>
          {data && data.orderNow.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-cabin font-medium">
              {data.orderNow.length}
            </span>
          )}
        </div>

        {data && data.orderNow.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <span className="text-sm font-cabin text-emerald-700">
              ✅ {t("noOrdersNeeded")}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.orderNow.map((item) => (
              <div
                key={item.itemId}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3 border",
                  item.totalStatus === "empty"
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">
                    {item.totalStatus === "empty" ? "🚨" : "🟠"}
                  </span>
                  <span className="text-sm font-cabin font-medium text-elite-black truncate">
                    {isAr ? item.nameAr : item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-sm font-cabin font-bold",
                      item.totalStatus === "empty"
                        ? "text-red-700"
                        : "text-amber-700",
                    )}
                  >
                    {item.totalQty}
                  </span>
                  <span className="text-xs text-elite-black/40 font-cabin">
                    {isAr ? item.unitAr : item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions — things to do */}
      {actions.length > 0 && (
        <div className="mb-5">
          <h2 className="font-calistoga text-base text-elite-burgundy mb-3 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            {t("actions")}
          </h2>
          <div className="space-y-2">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => {
                  if (action.key === "barCount")
                    router.push(`/${locale}/admin/inventory`);
                  else if (action.key === "receipts")
                    router.push(`/${locale}/admin/purchases`);
                  else if (action.key === "drafts")
                    router.push(`/${locale}/admin/inventory`);
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 border text-start transition-colors",
                  action.urgent
                    ? "bg-red-50 border-red-200 hover:bg-red-100"
                    : "bg-white border-elite-burgundy/10 hover:bg-elite-cream/50",
                )}
              >
                <span className="text-xl shrink-0">{action.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-cabin font-medium text-elite-black">
                    {action.label}
                  </div>
                  <div className="text-xs font-cabin text-elite-black/50">
                    {action.desc}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-elite-black/30 ms-auto shrink-0 rtl:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {actions.length === 0 && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <span className="text-sm font-cabin text-emerald-700">
            ✅ {t("allDone")}
          </span>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="font-calistoga text-base text-elite-burgundy mb-3">
          {t("quickLinks")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-elite-burgundy/10 p-4 hover:bg-elite-cream/50 transition-colors"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-cabin font-medium text-elite-black/70">
                {link.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
