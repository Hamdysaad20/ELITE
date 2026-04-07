"use client";

import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderStatus, Order } from "@/types";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { cn } from "@/lib/utils";

interface OrdersListProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  compact?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
}

export function OrdersList({
  orders,
  loading = false,
  error = null,
  onRetry,
  compact = false,
  maxItems,
  showViewAll = false,
}: OrdersListProps) {
  const t = useTranslations("ordersList");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  const safeOrders = Array.isArray(orders)
    ? orders.filter(
        (order) =>
          order &&
          typeof order === "object" &&
          typeof order.id === "string" &&
          order.id.length > 0,
      )
    : [];

  const formatOrderDate = (value: unknown): string => {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return format.dateTime(date, { dateStyle: "medium" });
  };
  // Loading State
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent mx-auto mb-4" />
        <p className="font-cabin text-elite-black/60">{t("loading")}</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border-2 border-elite-burgundy/20 rounded-3xl p-6 sm:p-8 text-center">
        <AlertCircle className="w-12 h-12 text-elite-burgundy mx-auto mb-4" />
        <h3 className="text-elite-black font-calistoga text-xl sm:text-2xl mb-2">
          {t("error.title")}
        </h3>
        <p className="text-elite-black/70 font-cabin text-sm sm:text-base mb-6">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-3 rounded-2xl font-cabin font-bold hover:bg-elite-burgundy/90 transition-all touch-manipulation active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            {t("error.retry")}
          </button>
        )}
      </div>
    );
  }

  // Empty State
  if (safeOrders.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-8 sm:p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-elite-cream flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-elite-burgundy" />
        </div>
        <h3 className="text-elite-black font-calistoga text-2xl sm:text-3xl mb-3">
          {t("empty.title")}
        </h3>
        <p className="text-elite-black/60 font-cabin text-sm sm:text-base mb-8 max-w-md mx-auto">
          {t("empty.description")}
        </p>
        <LocalizedLink
          href="/menu"
          className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-2xl font-cabin font-bold hover:bg-elite-burgundy/90 transition-all transform hover:scale-105 active:scale-95 touch-manipulation shadow-lg"
        >
          <ShoppingBag className="w-5 h-5" />
          {t("empty.browseMenu")}
        </LocalizedLink>
      </div>
    );
  }

  // Display orders (with optional limit)
  const displayOrders = maxItems ? safeOrders.slice(0, maxItems) : safeOrders;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black">
            {showViewAll ? t("recentOrders") : t("yourOrders")}
          </h2>
          <p className="font-cabin text-sm text-elite-black/50">
            {t("ordersCount", { count: safeOrders.length })}
          </p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {displayOrders.map((order) => {
          const isActive =
            order.status !== OrderStatus.DELIVERED &&
            order.status !== OrderStatus.CANCELLED;
          const displayId = String(order.id || "-")
            .slice(0, 8)
            .toUpperCase();

          return (
            <LocalizedLink
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.99] touch-manipulation group"
            >
              {/* Order Header */}
              <div className="bg-elite-cream/30 p-4 sm:p-5 border-b-2 border-elite-burgundy/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-elite-burgundy" : "bg-elite-cream"
                      }`}
                    >
                      {isActive ? (
                        <Clock className="w-6 h-6 text-elite-cream" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-elite-burgundy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-calistoga text-base sm:text-lg text-elite-black mb-1 truncate">
                        {t("orderId", { id: displayId })}
                      </h3>
                      <p className="text-xs sm:text-sm text-elite-black/60 font-cabin">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} size="sm" />
                </div>
              </div>

              {/* Order Details */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-elite-black/50 mb-1 font-cabin font-semibold uppercase tracking-wide">
                      {t("orderNumberLabel")}
                    </p>
                    <p className="font-cabin font-bold text-elite-black text-sm">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-elite-black/50 mb-1 font-cabin font-semibold uppercase tracking-wide">
                      {t("totalLabel")}
                    </p>
                    <p className="font-calistoga text-lg text-elite-burgundy">
                      {formatPrice(Number(order.total) || 0)}
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="pt-3 border-t-2 border-elite-burgundy/5">
                  <div className="flex items-center justify-between text-elite-burgundy group-hover:text-elite-burgundy/80 transition-colors">
                    <span className="font-cabin text-sm font-bold">
                      {t("viewDetails")}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 transition-transform rtl:rotate-180",
                        isRTL
                          ? "group-hover:-translate-x-1"
                          : "group-hover:translate-x-1",
                      )}
                    />
                  </div>
                </div>
              </div>
            </LocalizedLink>
          );
        })}
      </div>

      {/* View All Link */}
      {showViewAll && maxItems && orders.length > maxItems && (
        <LocalizedLink
          href="/orders"
          className="block text-center py-4 text-elite-burgundy font-cabin font-bold hover:text-elite-burgundy/80 transition-colors"
        >
          {t("viewAll", { count: safeOrders.length })}
        </LocalizedLink>
      )}
    </div>
  );
}
