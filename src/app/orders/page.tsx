"use client";

import { useState, useMemo } from "react";
import { useRequireAuth } from "@/lib/auth/hooks";
import { useOrders } from "@/hooks/useOrderStatus";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { Loader2, ChevronLeft } from "lucide-react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { OrdersAnalytics } from "@/components/orders/OrdersAnalytics";
import { OrdersList } from "@/components/orders/OrdersList";
import {
  OrderFilters,
  type OrderFilters as OrderFiltersType,
} from "@/components/orders/OrderFilters";
import { useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { normalizeOrderStatus } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { orders, loading, error, refetch } = useOrders();
  const t = useTranslations("ordersPage");
  const locale = useLocale();
  const isRTL = locale === "ar";

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
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-elite-burgundy animate-spin" />
            <p className="text-elite-black/70 font-cabin text-base">
              {t("loading")}
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />

      <div className="min-h-screen bg-elite-cream pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 md:pt-8 space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 rounded-3xl p-4 sm:p-6 space-y-3">
            {/* Back to Profile — desktop only */}
            <LocalizedLink
              href="/profile"
              className="hidden md:inline-flex items-center gap-2 text-elite-cream/80 hover:text-elite-cream transition-colors group"
            >
              <ChevronLeft
                className={cn(
                  "w-5 h-5 transition-transform",
                  isRTL
                    ? "group-hover:translate-x-1 rotate-180"
                    : "group-hover:-translate-x-1",
                )}
              />
              <span className="font-cabin text-sm font-semibold">
                {t("backToProfile")}
              </span>
            </LocalizedLink>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-cabin flex-wrap">
              <LocalizedLink
                href="/"
                className="text-elite-cream/60 hover:text-elite-cream transition-colors"
              >
                {t("breadcrumbs.home")}
              </LocalizedLink>
              <span className="text-elite-cream/40" aria-hidden="true">
                ·
              </span>
              <LocalizedLink
                href="/profile"
                className="text-elite-cream/60 hover:text-elite-cream transition-colors"
              >
                {t("breadcrumbs.profile")}
              </LocalizedLink>
              <span className="text-elite-cream/40" aria-hidden="true">
                ·
              </span>
              <span className="text-elite-cream font-semibold">
                {t("title")}
              </span>
            </div>

            {/* Page Title */}
            <h1 className="font-calistoga text-3xl sm:text-4xl text-elite-cream">
              {t("title")}
            </h1>
            <p className="font-cabin text-elite-cream/80 text-sm sm:text-base">
              {t("subtitle")}
            </p>
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
      </div>

      <Footer />
    </>
  );
}
