"use client";

import { useState, useMemo } from "react";
import { useRequireAuth } from "@/lib/auth/hooks";
import { useOrders } from "@/hooks/useOrderStatus";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { OrdersAnalytics } from "@/components/orders/OrdersAnalytics";
import { OrdersList } from "@/components/orders/OrdersList";
import {
  OrderFilters,
  type OrderFilters as OrderFiltersType,
} from "@/components/orders/OrderFilters";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { normalizeOrderStatus } from "@/lib/orderStatus";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { orders, loading, error, refetch } = useOrders();
  const t = useTranslations("ordersPage");

  // Filter state
  const [filters, setFilters] = useState<OrderFiltersType>({
    status: [],
    dateRange: { start: null, end: null, preset: "all" },
    orderType: "all",
    priceRange: { min: 0, max: 10000 },
    sortBy: "date",
    sortOrder: "desc",
  });

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = [...orders];

    // Filter by status
    if (filters.status.length > 0) {
      const selectedStatuses = new Set(
        filters.status.map((status) => normalizeOrderStatus(status)),
      );

      filtered = filtered.filter((order) =>
        selectedStatuses.has(normalizeOrderStatus(order.status)),
      );
    }

    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate >= filters.dateRange.start! &&
          orderDate <= filters.dateRange.end!
        );
      });
    }

    // Filter by order type
    if (filters.orderType !== "all") {
      filtered = filtered.filter(
        (order) => order.orderType === filters.orderType.toUpperCase(),
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "price":
          comparison = Number(a.total) - Number(b.total);
          break;
        case "savings":
          // TODO: Add savings comparison when data is available
          comparison = 0;
          break;
        case "points":
          comparison = (a.pointsEarned || 0) - (b.pointsEarned || 0);
          break;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [orders, filters]);

  if (authLoading || loading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title={t("title")} showBack={true} />
        <main className="min-h-screen bg-elite-cream flex items-center justify-center pt-16 md:pt-0">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin mb-4" />
            <p className="text-elite-black/70 font-cabin text-lg">
              {t("loading")}
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <MobileHeader title={t("title")} showBack={true} />

      <main className="min-h-screen bg-elite-cream pb-32 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-4 md:space-y-6">
          {/* Page Header with Breadcrumbs */}
          <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 rounded-3xl p-4 sm:p-6 space-y-3">
            {/* Back Button - Hidden on mobile */}
            <LocalizedLink
              href="/profile"
              className="hidden md:inline-flex items-center gap-2 text-elite-cream/80 hover:text-elite-cream transition-colors group"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-cabin text-sm font-semibold">
                {t("backToProfile")}
              </span>
            </LocalizedLink>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-cabin">
              <LocalizedLink
                href="/"
                className="text-elite-cream/60 hover:text-elite-cream transition-colors"
              >
                {t("breadcrumbs.home")}
              </LocalizedLink>
              <span className="text-elite-cream/40">/</span>
              <LocalizedLink
                href="/profile"
                className="text-elite-cream/60 hover:text-elite-cream transition-colors"
              >
                {t("breadcrumbs.profile")}
              </LocalizedLink>
              <span className="text-elite-cream/40">/</span>
              <span className="text-elite-cream font-semibold">
                {t("title")}
              </span>
            </div>

            {/* Page Title */}
            <h1 className="font-calistoga text-3xl sm:text-4xl text-elite-cream">
              {t("title")}
            </h1>
            <p className="font-cabin text-elite-cream/80">{t("subtitle")}</p>
          </div>

          {/* Analytics Overview */}
          <OrdersAnalytics orders={filteredOrders} />

          {/* Filters */}
          <OrderFilters
            filters={filters}
            onFilterChange={setFilters}
            orderCount={filteredOrders.length}
          />

          {/* Orders List */}
          <OrdersList
            orders={filteredOrders}
            loading={loading}
            error={error}
            onRetry={refetch}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
