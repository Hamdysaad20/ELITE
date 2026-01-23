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
import { getFirstValidImage, getLocalProductImageCandidates } from "@/lib/imageUtils";
import { apiClient } from "@/lib/auth/apiClient";
import Link from "next/link";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import { ReorderConfirmModal } from "./ReorderConfirmModal";

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
function getStatusInfo(status: string): {
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
      text: "Pending",
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Clock className="w-5 h-5" />,
      description: "We've received your order",
      progressBarBg: "bg-elite-black/10",
      progressBarFill: "bg-elite-burgundy",
    },
    [OrderStatus.CONFIRMED]: {
      text: "Confirmed",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: "Your order is confirmed",
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.PREPARING]: {
      text: "Preparing",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <Package className="w-5 h-5" />,
      description: "We're preparing your order",
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.READY]: {
      text: "Ready",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: "Your order is ready",
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      text: "On the way",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <Truck className="w-5 h-5" />,
      description: "Your order is being delivered",
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.DELIVERED]: {
      text: "Delivered",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: "Your order has been delivered",
      progressBarBg: "bg-elite-cream/20",
      progressBarFill: "bg-elite-cream",
    },
    [OrderStatus.CANCELLED]: {
      text: "Cancelled",
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Package className="w-5 h-5" />,
      description: "This order was cancelled",
      progressBarBg: "bg-elite-black/10",
      progressBarFill: "bg-elite-black/30",
    },
  };

  return (
    statusMap[status] || {
      text: status,
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Package className="w-5 h-5" />,
      description: "Order status unknown",
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
  const [reorderAction, setReorderAction] = useState<
    "replace" | "merge" | null
  >(null);
  const { addItem, clearCart, items: cartItems, itemCount } = useLocalCart();
  const { success, error: showError, info } = useToast();
  const router = useRouter();

  // Handle contact support - opens Facebook Messenger
  const handleContactSupport = () => {
    window.open("https://m.me/61577901386334", "_blank");
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
                Loading your order details...
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
                Order Not Found
              </h3>
              <p className="font-cabin text-sm text-white/90 leading-relaxed">
                We couldn't load this order
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
              This might have happened because:
            </p>
            <ul className="space-y-2 font-cabin text-sm text-elite-black/60">
              <li className="flex items-start gap-2">
                <span className="text-elite-burgundy mt-0.5">•</span>
                <span>The order ID is incorrect or doesn't exist</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-elite-burgundy mt-0.5">•</span>
                <span>You don't have permission to view this order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-elite-burgundy mt-0.5">•</span>
                <span>There was a temporary connection issue</span>
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
              <span>Try Again</span>
            </button>

            <Link
              href="/orders"
              className="w-full px-6 py-3 bg-white border-2 border-elite-burgundy/20 text-elite-burgundy rounded-2xl font-cabin font-bold text-base hover:bg-elite-cream/50 hover:border-elite-burgundy/40 hover:shadow-md transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-h-[48px]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>View All Orders</span>
            </Link>
          </div>

          {/* Help Link */}
          <div className="text-center pt-2">
            <button
              onClick={handleContactSupport}
              className="font-cabin text-sm text-elite-burgundy hover:text-elite-burgundy/80 underline transition-colors"
            >
              Need help? Contact Support
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
          Order Not Available
        </h3>
        <p className="font-cabin text-sm text-elite-black/60 mb-6">
          This order couldn't be loaded. Please try again.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Orders</span>
        </Link>
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

  const statusInfo = getStatusInfo(order.status);
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
    setReorderAction(action);
    setShowConfirmModal(false);
    executeReorder(action);
  };

  // Execute the actual reorder
  const executeReorder = async (action: "replace" | "merge") => {
    if (!order || isReordering) return;

    // Prevent multiple simultaneous reorders
    if (isReordering) {
      info("Reorder already in progress. Please wait...");
      return;
    }

    setIsReordering(true);

    try {
      // Validate order has items
      if (!order.items || order.items.length === 0) {
        showError("This order has no items to reorder.");
        setIsReordering(false);
        return;
      }

      // If replace, clear cart first
      if (action === "replace") {
        clearCart();
        info(
          `Cart cleared. Adding ${order.items.length} ${order.items.length === 1 ? "item" : "items"}...`,
        );
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
            failedItems.push(item.menuItem?.name || "Unknown item");
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
          failedItems.push(item.menuItem?.name || "Unknown item");
        }
      }

      // Show appropriate success/error message
      if (itemsAdded > 0 && itemsFailed === 0) {
        // All items added successfully
        success(
          `Perfect! ${itemsAdded} ${itemsAdded === 1 ? "item" : "items"} ${action === "replace" ? "added" : "added to your cart"}. Redirecting...`,
        );

        // Navigate to cart after a short delay
        setTimeout(() => {
          router.push("/order");
        }, 1500);
      } else if (itemsAdded > 0 && itemsFailed > 0) {
        // Some items added, some failed
        showError(
          `Added ${itemsAdded} ${itemsAdded === 1 ? "item" : "items"}, but ${itemsFailed} ${itemsFailed === 1 ? "item" : "items"} couldn't be added. Please check your cart.`,
        );

        // Still navigate to cart
        setTimeout(() => {
          router.push("/order");
        }, 2000);
      } else {
        // All items failed
        showError(
          "Sorry, we couldn't add any items to your cart. The products may no longer be available. Please browse our menu to order.",
        );
      }
    } catch (err) {
      console.error("Error reordering:", err);
      showError(
        "Oops! Something went wrong while adding items to your cart. Please try again or contact support if the problem persists.",
      );
    } finally {
      setIsReordering(false);
      setReorderAction(null);
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
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-md transition-all whitespace-nowrap touch-manipulation active:scale-95 min-h-[44px] snap-start flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-elite-burgundy" />
            <span className="font-cabin text-sm font-bold text-elite-black">
              All Orders
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-md transition-all whitespace-nowrap touch-manipulation active:scale-95 min-h-[44px] snap-start flex-shrink-0"
          >
            <Home className="w-4 h-4 text-elite-burgundy" />
            <span className="font-cabin text-sm font-bold text-elite-black">
              Profile
            </span>
          </Link>
          <Link
            href="/menu"
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-md transition-all whitespace-nowrap touch-manipulation active:scale-95 min-h-[44px] snap-start flex-shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-elite-burgundy" />
            <span className="font-cabin text-sm font-bold text-elite-black">
              Shop Menu
            </span>
          </Link>
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
                className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-cabin font-bold bg-white/90 backdrop-blur-sm ${statusInfo.color === "text-elite-cream" ? "text-elite-burgundy" : "text-elite-black"} border-2 ${statusInfo.color === "text-elite-cream" ? "border-elite-cream/30" : "border-elite-burgundy"} ml-auto shadow-md`}
              >
                Order #{displayOrderId}
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
                    Order Progress
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
                Placed on{" "}
                {createdAt.toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
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
                        Est. Arrival
                      </p>
                      <p className="font-calistoga text-lg sm:text-xl text-elite-black truncate">
                        {estimatedDelivery.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
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
                      Delivery In
                    </p>
                    <p className="font-calistoga text-lg sm:text-xl text-elite-black truncate">
                      {estimatedDelivery
                        ? Math.max(
                            1,
                            Math.ceil(
                              (estimatedDelivery.getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          )
                        : 3}{" "}
                      Days
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
                        Destination
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
              Delivery Details
            </h2>

            <div className="space-y-4">
              {/* Address */}
              <div className="bg-elite-cream/30 rounded-2xl p-4">
                <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide mb-2">
                  Delivering To
                </p>
                <p className="font-cabin text-base text-elite-black font-semibold">
                  {order.address.label || "Home"}
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
                  Tracking Number
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-cabin font-mono text-sm sm:text-base text-elite-black font-bold">
                    {order.id.slice(0, 16).toUpperCase()}
                  </p>
                  <button
                    onClick={copyTrackingNumber}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-elite-burgundy text-elite-cream hover:bg-elite-burgundy/90 transition-all active:scale-95 touch-manipulation"
                    title="Copy tracking number"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {copiedTracking && (
                  <p className="text-xs text-elite-burgundy font-cabin font-semibold mt-2 animate-pulse">
                    ✓ Copied to clipboard!
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
            Your Items ({order.items.length})
          </h2>

          <div className="space-y-4">
            {order.items.map((item) => {
              const itemName = item.menuItem?.name || "Unknown Item";
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
                          EGP {item.unitPrice.toFixed(2)}
                        </span>
                        <span className="mx-1 sm:mx-2">×</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <p className="font-calistoga text-base sm:text-lg text-elite-burgundy whitespace-nowrap">
                        EGP {item.totalPrice.toFixed(2)}
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
              <span>Subtotal</span>
              <span className="font-semibold">
                EGP {order.subtotal.toFixed(2)}
              </span>
            </div>

            {order.deliveryFee > 0 && (
              <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Delivery Fee
                </span>
                <span className="font-semibold">
                  EGP {order.deliveryFee.toFixed(2)}
                </span>
              </div>
            )}

            {order.codFee > 0 && (
              <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  COD Fee
                </span>
                <span className="font-semibold">
                  EGP {order.codFee.toFixed(2)}
                </span>
              </div>
            )}

            {order.discount > 0 && (
              <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-burgundy">
                <span>Discount</span>
                <span className="font-bold">
                  -EGP {order.discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center font-cabin text-lg sm:text-xl font-bold text-elite-black pt-3 border-t-2 border-elite-burgundy/10">
              <span>Total</span>
              <span className="text-elite-burgundy">
                EGP {order.total.toFixed(2)}
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
                  Need Help?
                </h3>
              </div>
              <p className="font-cabin text-sm text-elite-cream/90 mb-4 leading-relaxed">
                Questions about your order? We're here to help via Facebook
                Messenger.
              </p>
              <button
                onClick={handleContactSupport}
                className="w-full px-6 py-3 sm:py-3.5 bg-elite-cream text-elite-burgundy rounded-2xl font-cabin font-bold text-base hover:bg-white hover:shadow-lg transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Phone className="w-5 h-5" />
                <span>Contact Support</span>
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
                  Loved It?
                </h3>
              </div>
              <p className="font-cabin text-sm text-elite-black/70 mb-4 leading-relaxed">
                Order the same items again with one click.
              </p>
              <button
                onClick={handleReorderClick}
                disabled={isReordering || !order || order.items.length === 0}
                className="w-full px-6 py-3 sm:py-3.5 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 hover:shadow-lg transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px]"
                aria-busy={isReordering}
                aria-label={
                  isReordering ? "Adding items to cart" : "Reorder this order"
                }
              >
                {isReordering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Adding to Cart...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Reorder Now</span>
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
