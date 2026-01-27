"use client";

import { useOrder } from "@/hooks/useOrder";
import { OrderStatus, OrderType } from "@/types";
import {
  Loader2,
  Truck,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  Copy,
  Phone,
  CreditCard,
  ArrowLeft,
  Home,
  ShoppingBag,
  Coffee,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import ImageWithFallback from "./ui/ImageWithFallback";
import {
  getFirstValidImage,
  getLocalProductImageCandidates,
} from "@/lib/imageUtils";
import { apiClient } from "@/lib/auth/apiClient";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useToast } from "@/components/ToastProvider";
import { ReorderConfirmModal } from "./ReorderConfirmModal";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";
import { useOrdering } from "@/context/OrderingContext";
import { SUPPORT_MESSENGER_URL, openSupportMessenger } from "@/lib/support";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";

interface OrderDetailCardProps {
  orderId: string;
}

/**
 * Calculate estimated delivery date based on order status
 */
function getEstimatedDeliveryDate(
  orderDate: Date,
  status: string,
): Date | null {
  const daysToAdd: Record<string, number> = {
    [OrderStatus.PENDING]: 3,
    [OrderStatus.CONFIRMED]: 3,
    [OrderStatus.PREPARING]: 2,
    [OrderStatus.READY]: 1,
    [OrderStatus.OUT_FOR_DELIVERY]: 1,
  };

  const days = daysToAdd[status];
  if (!days) return null;

  const estimated = new Date(orderDate);
  estimated.setDate(estimated.getDate() + days);
  return estimated;
}

/**
 * Get status badge color and text
 * Simplified status labels for better UX - using only branded colors
 */
function getStatusInfo(
  status: string,
  t: ReturnType<typeof useTranslations>,
): {
  text: string;
  color: string;
  bgColor: string;
  icon: JSX.Element;
  description: string;
  progressBarBg: string;
  progressBarFill: string;
} {
  const statusMap: Record<
    string,
    {
      text: string;
      color: string;
      bgColor: string;
      icon: JSX.Element;
      description: string;
      progressBarBg: string;
      progressBarFill: string;
    }
  > = {
    [OrderStatus.PENDING]: {
      text: t("status.pending.title"),
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Clock className="w-5 h-5" />,
      description: t("status.pending.description"),
      progressBarBg: "bg-elite-black/10",
      progressBarFill: "bg-elite-burgundy",
    },
    [OrderStatus.CONFIRMED]: {
      text: t("status.confirmed.title"),
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: t("status.confirmed.description"),
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.PREPARING]: {
      text: t("status.preparing.title"),
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <Package className="w-5 h-5" />,
      description: t("status.preparing.description"),
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.READY]: {
      text: t("status.ready.title"),
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: t("status.ready.description"),
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      text: t("status.outForDelivery.title"),
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <Truck className="w-5 h-5" />,
      description: t("status.outForDelivery.description"),
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.DELIVERED]: {
      text: t("status.delivered.title"),
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: t("status.delivered.description"),
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.CANCELLED]: {
      text: t("status.cancelled.title"),
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Package className="w-5 h-5" />,
      description: t("status.cancelled.description"),
      progressBarBg: "bg-elite-black/10",
      progressBarFill: "bg-elite-black/30",
    },
  };

  return (
    statusMap[status] || {
      text: t("status.unknown.title", { status }),
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Package className="w-5 h-5" />,
      description: t("status.unknown.description"),
      progressBarBg: "bg-elite-black/10",
      progressBarFill: "bg-elite-burgundy",
    }
  );
}

/**
 * Component to display order details in a modern, mobile-first way
 * Redesigned for better UX with bigger touch targets and cleaner information hierarchy
 */
export function OrderDetailCard({ orderId }: OrderDetailCardProps) {
  const { order, loading, error, refetch } = useOrder(orderId);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { addItem, clearCart, itemCount } = useLocalCart();
  const { success, error: showError, info } = useToast();
  const t = useTranslations("orderDetail");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const localizedRouter = useLocalizedRouter();

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    });
  // Removed unused router since we have localizedRouter
  const { orderingEnabled, orderingMessage } = useOrdering();

  // Handle contact support - opens Facebook Messenger
  const handleContactSupport = () => {
    window.open(SUPPORT_MESSENGER_URL, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Loading Skeleton */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
          <div className="bg-elite-cream/50 px-6 py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin" />
              <p className="font-cabin text-sm text-elite-black/60 font-medium">
                {t("loading")}
              </p>
            </div>
          </div>
        </div>

        {/* Loading Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6"
            >
              <div className="h-32 bg-elite-cream/30 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-red-200 rounded-3xl shadow-lg overflow-hidden">
        {/* Error Header */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-calistoga text-xl text-white mb-1">
                {t("error.title")}
              </h3>
              <p className="font-cabin text-sm text-white/90 leading-relaxed">
                {t("error.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="px-6 py-6 space-y-4">
          <p className="font-cabin text-sm text-elite-black/70 leading-relaxed">
            {error}
          </p>

          <div className="bg-elite-cream/40 rounded-2xl p-4 border-2 border-elite-burgundy/5">
            <p className="font-cabin text-sm text-elite-black/60 mb-3">
              {t("error.causesTitle")}
            </p>
            <ul className="space-y-2 font-cabin text-sm text-elite-black/60">
              <li className="flex items-start gap-2">
                <span className="text-elite-burgundy mt-0.5">•</span>
                <span>{t("error.causes.invalidId")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-elite-burgundy mt-0.5">•</span>
                <span>{t("error.causes.permission")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-elite-burgundy mt-0.5">•</span>
                <span>{t("error.causes.connection")}</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => refetch()}
              className="w-full px-6 py-3 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 hover:shadow-lg transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Package className="w-5 h-5" />
              <span>{t("error.retry")}</span>
            </button>

            <LocalizedLink
              href="/orders"
              className="w-full px-6 py-3 bg-white border-2 border-elite-burgundy/20 text-elite-burgundy rounded-2xl font-cabin font-bold text-base hover:bg-elite-cream/50 hover:border-elite-burgundy/40 hover:shadow-md transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-h-[48px]"
            >
              <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
              <span>{t("error.viewAllOrders")}</span>
            </LocalizedLink>
          </div>

          {/* Help Link */}
          <div className="text-center pt-2">
            <button
              onClick={handleContactSupport}
              className="font-cabin text-sm text-elite-burgundy hover:text-elite-burgundy/80 underline transition-colors"
            >
              {t("error.contactSupport")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white border-2 border-elite-burgundy/10 rounded-3xl shadow-lg p-12 text-center">
        <Package className="w-16 h-16 text-elite-burgundy/30 mx-auto mb-4" />
        <h3 className="font-calistoga text-xl text-elite-black mb-2">
          {t("notAvailable.title")}
        </h3>
        <p className="font-cabin text-sm text-elite-black/60 mb-6">
          {t("notAvailable.description")}
        </p>
        <LocalizedLink
          href="/orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 transition-all active:scale-95"
        >
          <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          <span>{t("notAvailable.backToOrders")}</span>
        </LocalizedLink>
      </div>
    );
  }

  // Ensure dates are Date objects
  const createdAt =
    order.createdAt instanceof Date
      ? order.createdAt
      : new Date(order.createdAt);
  const updatedAt =
    order.updatedAt instanceof Date
      ? order.updatedAt
      : new Date(order.updatedAt);

  const statusInfo = getStatusInfo(order.status, t);
  const estimatedDelivery = getEstimatedDeliveryDate(createdAt, order.status);
  const isInProgress =
    order.status !== OrderStatus.DELIVERED &&
    order.status !== OrderStatus.CANCELLED;

  // Calculate delivery progress (0-100%)
  const getDeliveryProgress = () => {
    const progressMap: Record<string, number> = {
      [OrderStatus.PENDING]: 10,
      [OrderStatus.CONFIRMED]: 25,
      [OrderStatus.PREPARING]: 50,
      [OrderStatus.READY]: 75,
      [OrderStatus.OUT_FOR_DELIVERY]: 90,
      [OrderStatus.DELIVERED]: 100,
    };
    return progressMap[order.status] || 0;
  };

  const copyTrackingNumber = () => {
    if (order.id) {
      navigator.clipboard.writeText(order.id);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  // Handle reorder click - check if cart has items
  const handleReorderClick = () => {
    if (!order || isReordering) return;
    if (!orderingEnabled) {
      openSupportMessenger();
      info(
        orderingMessage ||
        ORDERING_DISABLED_MESSAGE,
      );
      return;
    }

    // Check if cart has items
    if (itemCount > 0) {
      // Show confirmation modal
      setShowConfirmModal(true);
    } else {
      // Cart is empty, proceed with reorder
      executeReorder("merge");
    }
  };

  // Handle confirmation from modal
  const handleConfirmReorder = (action: "replace" | "merge") => {
    setShowConfirmModal(false);
    executeReorder(action);
  };

  // Execute the actual reorder
  const executeReorder = async (action: "replace" | "merge") => {
    if (!order || isReordering) return;

    // Prevent multiple simultaneous reorders
    if (isReordering) {
      info(t("reorder.inProgress"));
      return;
    }

    setIsReordering(true);

    try {
      // Validate order has items
      if (!order.items || order.items.length === 0) {
        showError(t("reorder.noItems"));
        setIsReordering(false);
        return;
      }

      // If replace, clear cart first
      if (action === "replace") {
        clearCart();
        info(t("reorder.cartCleared", { count: order.items.length }));
      }

      let itemsAdded = 0;
      let itemsFailed = 0;
      const failedItems: string[] = [];

      for (const item of order.items) {
        try {
          // Validate item data
          if (!item.menuItemId || !item.menuItem?.name) {
            console.warn("Skipping item with missing data:", item);
            itemsFailed++;
            failedItems.push(item.menuItem?.name || t("reorder.unknownItem"));
            continue;
          }

          // Build attributes from order item data
          const attributes: Record<
            string,
            Array<{
              valueId: number;
              valueName: string;
              priceExtra: number;
            }>
          > = {};

          // If item has stored attributes, use them
          if (item.attributes && typeof item.attributes === "object") {
            if (
              "formatted" in item.attributes &&
              Array.isArray(item.attributes.formatted)
            ) {
              // Convert formatted attributes back to structured format
              const formattedAttrs = item.attributes.formatted as string[];
              formattedAttrs.forEach((attr, idx) => {
                attributes[`Attribute_${idx}`] = [
                  {
                    valueId: idx,
                    valueName: attr,
                    priceExtra: 0,
                  },
                ];
              });
            } else {
              // Assume it's already in the correct format
              Object.assign(attributes, item.attributes);
            }
          }

          // Add item to cart
          addItem({
            productId: item.menuItemId,
            name: item.menuItem?.name || `Product ${item.menuItemId}`,
            basePrice: item.unitPrice,
            quantity: item.quantity,
            attributes: attributes,
            totalPrice: item.totalPrice,
            image:
              getLocalProductImageCandidates(item.menuItem?.name)[0] ||
              item.menuItem?.images?.[0],
          });

          itemsAdded++;
        } catch (itemErr) {
          console.error("Error adding item to cart:", itemErr);
          itemsFailed++;
          failedItems.push(item.menuItem?.name || t("reorder.unknownItem"));
        }
      }

      // Show appropriate success/error message
      if (itemsAdded > 0 && itemsFailed === 0) {
        // All items added successfully
        success(
          t("reorder.addedAll", {
            count: itemsAdded,
            action:
              action === "replace"
                ? t("reorder.actions.added")
                : t("reorder.actions.addedToCart"),
          }),
        );

        // Navigate to cart after a short delay
        setTimeout(() => {
          localizedRouter.push("/order");
        }, 1500);
      } else if (itemsAdded > 0 && itemsFailed > 0) {
        // Some items added, some failed
        showError(
          t("reorder.addedSome", {
            added: itemsAdded,
            failed: itemsFailed,
          }),
        );

        // Still navigate to cart
        setTimeout(() => {
          localizedRouter.push("/order");
        }, 2000);
      } else {
        // All items failed
        showError(t("reorder.addedNone"));
      }
    } catch (err) {
      console.error("Error reordering:", err);
      showError(t("reorder.error"));
    } finally {
      setIsReordering(false);
    }
  };

  // Format order ID for display
  const displayOrderId = order.id.slice(0, 8).toUpperCase();

  return (
    <>
      {/* Reorder Confirmation Modal */}
      <ReorderConfirmModal
        isOpen={showConfirmModal}
        onClose={() => !isReordering && setShowConfirmModal(false)}
        onConfirm={handleConfirmReorder}
        existingItemCount={itemCount}
        reorderItemCount={order?.items?.length || 0}
        isProcessing={isReordering}
      />

      <div className="space-y-4 md:space-y-6">
        {/* Navigation Breadcrumb - Enhanced Mobile Responsive */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory">
          <LocalizedLink
            href="/orders"
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-md transition-all whitespace-nowrap touch-manipulation active:scale-95 min-h-[44px] snap-start flex-shrink-0"
          >
            <ArrowLeft
              className={cn(
                "w-4 h-4 text-elite-burgundy",
                isRTL && "rotate-180",
              )}
            />
            <span className="font-cabin text-sm font-bold text-elite-black">
              {t("breadcrumbs.allOrders")}
            </span>
          </LocalizedLink>
          <LocalizedLink
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-md transition-all whitespace-nowrap touch-manipulation active:scale-95 min-h-[44px] snap-start flex-shrink-0"
          >
            <Home className="w-4 h-4 text-elite-burgundy" />
            <span className="font-cabin text-sm font-bold text-elite-black">
              {t("breadcrumbs.profile")}
            </span>
          </LocalizedLink>
          <LocalizedLink
            href="/menu"
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-md transition-all whitespace-nowrap touch-manipulation active:scale-95 min-h-[44px] snap-start flex-shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-elite-burgundy" />
            <span className="font-cabin text-sm font-bold text-elite-black">
              {t("breadcrumbs.shopMenu")}
            </span>
          </LocalizedLink>
        </div>

        {/* Status Hero Card - Improved Mobile Responsive Design */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/10 overflow-hidden">
          {/* Header with Status */}
          <div className={`${statusInfo.bgColor} px-4 sm:px-6 py-6 sm:py-8`}>
            {/* Order ID Badge - Better Mobile Positioning */}
            <div className="flex items-center justify-between mb-4 sm:mb-0">
              <div className="flex items-center gap-2 sm:hidden">
                <div className={`${statusInfo.color}`}>{statusInfo.icon}</div>
              </div>
              <span
                className={cn(
                  `px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-cabin font-bold bg-white/90 backdrop-blur-sm ${statusInfo.color === "text-elite-cream"
                    ? "text-elite-burgundy"
                    : "text-elite-black"
                  } border-2 ${statusInfo.color === "text-elite-cream"
                    ? "border-elite-cream/30"
                    : "border-elite-burgundy"
                  } shadow-md`,
                  isRTL ? "mr-auto" : "ml-auto",
                )}
              >
                {t("orderId", { id: displayOrderId })}
              </span>
            </div>

            {/* Status Info - Enhanced Layout */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div
                className={`hidden sm:flex w-12 h-12 rounded-2xl ${statusInfo.color === "text-elite-cream" ? "bg-elite-cream/20" : "bg-elite-burgundy/10"} items-center justify-center flex-shrink-0 ${statusInfo.color}`}
              >
                {statusInfo.icon}
              </div>
              <div className="flex-1">
                <h2
                  className={`font-calistoga text-2xl sm:text-3xl md:text-4xl ${statusInfo.color} mb-2`}
                >
                  {statusInfo.text}
                </h2>
                <p
                  className={`font-cabin text-sm sm:text-base md:text-lg ${statusInfo.color} ${statusInfo.color === "text-elite-cream" ? "opacity-90" : "opacity-70"}`}
                >
                  {statusInfo.description}
                </p>
              </div>
            </div>

            {/* Progress Bar - Adaptive Colors */}
            {isInProgress && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-cabin text-xs sm:text-sm font-bold uppercase tracking-wider ${statusInfo.color}`}
                  >
                    {t("progress.label")}
                  </span>
                  <span
                    className={`font-calistoga text-base sm:text-lg ${statusInfo.color}`}
                  >
                    {getDeliveryProgress()}%
                  </span>
                </div>
                <div
                  className={`w-full ${statusInfo.progressBarBg} rounded-full h-3 sm:h-4 overflow-hidden shadow-inner`}
                >
                  <div
                    className={`${statusInfo.progressBarFill} h-full rounded-full transition-all duration-700 ease-out shadow-sm`}
                    style={{ width: `${getDeliveryProgress()}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Date - Enhanced Styling */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-elite-cream/40 to-elite-cream/20 border-t border-elite-burgundy/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-elite-burgundy/60" />
              <p className="font-cabin text-xs sm:text-sm text-elite-black/70 font-medium">
                {t("placedOn", {
                  date: format.dateTime(createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Info Cards - Horizontal Scroll for Mobile */}
        {isInProgress && order.orderType === OrderType.DELIVERY && (
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="flex gap-3 sm:gap-4 md:grid md:grid-cols-3 snap-x snap-mandatory touch-pan-x pb-2">
              {/* Estimated Arrival Card */}
              {estimatedDelivery && (
                <div className="min-w-[280px] sm:min-w-0 snap-center bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6 flex-shrink-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-elite-cream flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-elite-burgundy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
                        {t("delivery.estimatedArrival")}
                      </p>
                      <p className="font-calistoga text-lg sm:text-xl text-elite-black truncate">
                        {format.dateTime(estimatedDelivery, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Time Card */}
              <div className="min-w-[280px] sm:min-w-0 snap-center bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6 flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-elite-cream flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-elite-burgundy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
                      {t("delivery.deliveryIn")}
                    </p>
                    <p className="font-calistoga text-lg sm:text-xl text-elite-black truncate">
                      {t("delivery.days", {
                        count: estimatedDelivery
                          ? Math.max(
                            1,
                            Math.ceil(
                              (estimatedDelivery.getTime() -
                                new Date().getTime()) /
                              (1000 * 60 * 60 * 24),
                            ),
                          )
                          : 3,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              {order.address && (
                <div className="min-w-[280px] sm:min-w-0 snap-center bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6 flex-shrink-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-elite-cream flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-elite-burgundy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
                        {t("delivery.destination")}
                      </p>
                      <p className="font-calistoga text-lg sm:text-xl text-elite-black truncate">
                        {order.address.city}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Address & Tracking */}
        {order.orderType === OrderType.DELIVERY && order.address && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6 space-y-5">
            <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black flex items-center gap-2">
              <MapPin className="w-6 h-6 text-elite-burgundy" />
              {t("delivery.detailsTitle")}
            </h2>

            <div className="space-y-4">
              {/* Address */}
              <div className="bg-elite-cream/30 rounded-2xl p-4">
                <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide mb-2">
                  {t("delivery.deliveringTo")}
                </p>
                <p className="font-cabin text-base text-elite-black font-semibold">
                  {order.address.label || t("delivery.defaultLabel")}
                </p>
                <p className="font-cabin text-sm text-elite-black/70 mt-1 leading-relaxed">
                  {order.address.street}
                  {order.address.apartment && `, ${order.address.apartment}`}
                  <br />
                  {order.address.city}
                  {order.address.state && `, ${order.address.state}`}
                  {order.address.zipCode && ` ${order.address.zipCode}`}
                </p>
              </div>

              {/* Tracking Number */}
              <div className="bg-elite-cream/30 rounded-2xl p-4">
                <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide mb-2">
                  {t("delivery.trackingNumber")}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-cabin font-mono text-sm sm:text-base text-elite-black font-bold">
                    {order.id.slice(0, 16).toUpperCase()}
                  </p>
                  <button
                    onClick={copyTrackingNumber}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-elite-burgundy text-elite-cream hover:bg-elite-burgundy/90 transition-all active:scale-95 touch-manipulation"
                    title={t("delivery.copyTracking")}
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {copiedTracking && (
                  <p className="text-xs text-elite-burgundy font-cabin font-semibold mt-2 animate-pulse">
                    {t("delivery.copied")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Items - Fixed Image Sizing */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-4 sm:p-6">
          <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black mb-5 flex items-center gap-2">
            <Package className="w-6 h-6 text-elite-burgundy" />
            {t("items.title", { count: order.items.length })}
          </h2>

          <div className="space-y-4">
            {order.items.map((item) => {
              const itemName = item.menuItem?.name || t("items.unknown");
              const itemImage =
                item.menuItem?.images && item.menuItem.images.length > 0
                  ? getFirstValidImage(item.menuItem.images)
                  : null;
              const categoryId = item.menuItem?.category || "drinks";

              return (
                <div
                  key={item.id}
                  className="flex gap-3 sm:gap-4 pb-4 border-b-2 border-elite-burgundy/5 last:border-0 last:pb-0 touch-manipulation group"
                >
                  {/* Product Image - Matches Product Card Style */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition-all duration-300 group-hover:shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy/8 to-elite-burgundy/15">
                      {itemImage ? (
                        <ImageWithFallback
                          src={itemImage}
                          alt={itemName}
                          fill={true}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          fallbackSrc=""
                        />
                      ) : (
                        // Fallback icon when no image
                        <div className="w-full h-full flex items-center justify-center bg-elite-burgundy">
                          {categoryId.toLowerCase().includes("food") ? (
                            <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-elite-cream" />
                          ) : (
                            <Coffee className="w-10 h-10 sm:w-12 sm:h-12 text-elite-cream" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-calistoga text-base sm:text-lg text-elite-black mb-1 line-clamp-2 leading-tight">
                        {itemName}
                      </h3>

                      {/* Attributes */}
                      {item.attributes &&
                        typeof item.attributes === "object" &&
                        "formatted" in item.attributes &&
                        Array.isArray(item.attributes.formatted) &&
                        item.attributes.formatted.length > 0 && (
                          <p className="font-cabin text-xs sm:text-sm text-elite-black/50 mb-2 line-clamp-2">
                            {item.attributes.formatted.join(" • ")}
                          </p>
                        )}
                    </div>

                    {/* Price and Quantity */}
                    <div className="flex items-end justify-between gap-2 mt-1">
                      <div className="font-cabin text-xs sm:text-sm text-elite-black/60">
                        <span className="font-semibold">
                          {formatPrice(item.unitPrice)}
                        </span>
                        <span className="mx-1 sm:mx-2">×</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <p className="font-calistoga text-base sm:text-lg text-elite-burgundy whitespace-nowrap">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t-2 border-elite-burgundy/10 space-y-3">
            <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
              <span>{t("summary.subtotal")}</span>
              <span className="font-semibold">{formatPrice(order.subtotal)}</span>
            </div>

            {order.deliveryFee > 0 && (
              <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {t("summary.deliveryFee")}
                </span>
                <span className="font-semibold">
                  {formatPrice(order.deliveryFee)}
                </span>
              </div>
            )}

            {order.codFee > 0 && (
              <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {t("summary.codFee")}
                </span>
                <span className="font-semibold">{formatPrice(order.codFee)}</span>
              </div>
            )}

            {order.discount > 0 && (
              <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-burgundy">
                <span>{t("summary.discount")}</span>
                <span className="font-bold">
                  -{formatPrice(order.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center font-cabin text-lg sm:text-xl font-bold text-elite-black pt-3 border-t-2 border-elite-burgundy/10">
              <span>{t("summary.total")}</span>
              <span className="text-elite-burgundy">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Cards - Enhanced with Real Functionality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Need Help - Opens Facebook Messenger */}
          <div className="bg-gradient-to-br from-elite-burgundy via-elite-burgundy to-elite-burgundy/90 rounded-3xl shadow-xl p-5 sm:p-6 text-elite-cream relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-6 h-6" />
                <h3 className="font-calistoga text-lg sm:text-xl">
                  {t("support.title")}
                </h3>
              </div>
              <p className="font-cabin text-sm text-elite-cream/90 mb-4 leading-relaxed">
                {t("support.description")}
              </p>
              <button
                onClick={handleContactSupport}
                className="w-full px-6 py-3 sm:py-3.5 bg-elite-cream text-elite-burgundy rounded-2xl font-cabin font-bold text-base hover:bg-white hover:shadow-lg transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Phone className="w-5 h-5" />
                <span>{t("support.cta")}</span>
              </button>
            </div>
          </div>

          {/* Reorder - Adds Items to Cart */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-elite-burgundy/10 p-5 sm:p-6 relative overflow-hidden group hover:border-elite-burgundy/30 transition-all duration-300">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-elite-cream/0 via-elite-cream/30 to-elite-cream/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-6 h-6 text-elite-burgundy" />
                <h3 className="font-calistoga text-lg sm:text-xl text-elite-black">
                  {t("reorderCard.title")}
                </h3>
              </div>
              <p className="font-cabin text-sm text-elite-black/70 mb-4 leading-relaxed">
                {t("reorderCard.description")}
              </p>
              <button
                onClick={handleReorderClick}
                disabled={
                  isReordering ||
                  !order ||
                  order.items.length === 0
                }
                className="w-full px-6 py-3 sm:py-3.5 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 hover:shadow-lg transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px]"
                aria-busy={isReordering}
                aria-label={
                  isReordering
                    ? t("reorderCard.ariaAdding")
                    : t("reorderCard.ariaReorder")
                }
              >
                {isReordering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t("reorderCard.adding")}</span>
                  </>
                ) : !orderingEnabled ? (
                  <span>Get updates</span>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>{t("reorderCard.cta")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
