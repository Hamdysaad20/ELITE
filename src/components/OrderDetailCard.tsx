"use client";

import { useOrder } from "@/hooks/useOrder";
import { OrderStatus, OrderType } from "@/types";
import { Loader2, Truck, Clock, CheckCircle2, Package, MapPin, Copy, Phone, CreditCard, ArrowLeft, Home, ShoppingBag } from "lucide-react";
import { useState } from "react";
import ImageWithFallback from "./ui/ImageWithFallback";
import { getFirstValidImage } from "@/lib/imageUtils";
import { apiClient } from "@/lib/auth/apiClient";
import Link from "next/link";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

interface OrderDetailCardProps {
  orderId: string;
}

/**
 * Calculate estimated delivery date based on order status
 */
function getEstimatedDeliveryDate(orderDate: Date, status: string): Date | null {
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
} {
  const statusMap: Record<string, { 
    text: string; 
    color: string; 
    bgColor: string; 
    icon: JSX.Element;
    description: string;
  }> = {
    [OrderStatus.PENDING]: {
      text: "Pending",
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Clock className="w-5 h-5" />,
      description: "We've received your order",
    },
    [OrderStatus.CONFIRMED]: {
      text: "Confirmed",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: "Your order is confirmed",
    },
    [OrderStatus.PREPARING]: {
      text: "Preparing",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <Package className="w-5 h-5" />,
      description: "We're preparing your order",
    },
    [OrderStatus.READY]: {
      text: "Ready",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: "Your order is ready",
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      text: "On the way",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <Truck className="w-5 h-5" />,
      description: "Your order is being delivered",
    },
    [OrderStatus.DELIVERED]: {
      text: "Delivered",
      color: "text-elite-cream",
      bgColor: "bg-elite-burgundy",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: "Your order has been delivered",
    },
    [OrderStatus.CANCELLED]: {
      text: "Cancelled",
      color: "text-elite-black",
      bgColor: "bg-elite-cream",
      icon: <Package className="w-5 h-5" />,
      description: "This order was cancelled",
    },
  };

  return statusMap[status] || {
    text: status,
    color: "text-elite-black",
    bgColor: "bg-elite-cream",
    icon: <Package className="w-5 h-5" />,
    description: "Order status unknown",
  };
}

/**
 * Component to display order details in a modern, mobile-first way
 * Redesigned for better UX with bigger touch targets and cleaner information hierarchy
 */
export function OrderDetailCard({ orderId }: OrderDetailCardProps) {
  const { order, loading, error, refetch } = useOrder(orderId);
  const [copiedTracking, setCopiedTracking] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-elite-burgundy/10">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-elite-burgundy animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
        <p className="text-red-800 font-cabin text-center text-lg">{error}</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // Ensure dates are Date objects
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
  const updatedAt = order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt);
  
  const statusInfo = getStatusInfo(order.status);
  const estimatedDelivery = getEstimatedDeliveryDate(createdAt, order.status);
  const isInProgress = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;

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

  // Format order ID for display
  const displayOrderId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        <Link
          href="/orders"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all whitespace-nowrap touch-manipulation active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-elite-burgundy" />
          <span className="font-cabin text-sm font-semibold text-elite-black">All Orders</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all whitespace-nowrap touch-manipulation active:scale-95"
        >
          <Home className="w-4 h-4 text-elite-burgundy" />
          <span className="font-cabin text-sm font-semibold text-elite-black">Profile</span>
        </Link>
        <Link
          href="/menu"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all whitespace-nowrap touch-manipulation active:scale-95"
        >
          <ShoppingBag className="w-4 h-4 text-elite-burgundy" />
          <span className="font-cabin text-sm font-semibold text-elite-black">Order Again</span>
        </Link>
      </div>

      {/* Status Hero Card */}
      <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
        {/* Header with Status */}
        <div className={`${statusInfo.bgColor} px-5 sm:px-6 py-6 sm:py-8`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${statusInfo.color}`}>
                  {statusInfo.icon}
                </div>
                <h2 className={`font-calistoga text-2xl sm:text-3xl ${statusInfo.color}`}>
                  {statusInfo.text}
                </h2>
              </div>
              <p className={`font-cabin text-sm sm:text-base ${statusInfo.color} opacity-80`}>
                {statusInfo.description}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-cabin font-bold ${statusInfo.bgColor} ${statusInfo.color} border-2 border-elite-burgundy`}>
              Order #{displayOrderId}
            </span>
          </div>
          
          {/* Progress Bar */}
          {isInProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-cabin text-xs font-semibold ${statusInfo.color}`}>
                  Progress
                </span>
                <span className={`font-cabin text-xs font-bold ${statusInfo.color}`}>
                  {getDeliveryProgress()}%
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-3">
                <div
                  className="bg-elite-burgundy h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getDeliveryProgress()}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Order Date */}
        <div className="px-5 sm:px-6 py-4 bg-elite-cream/30 border-t border-elite-burgundy/10">
          <p className="font-cabin text-sm text-elite-black/60">
            Placed on {createdAt.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
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
                      {estimatedDelivery.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
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
                      ? Math.max(1, Math.ceil((estimatedDelivery.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
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

      {/* Order Items */}
      <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6">
        <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black mb-5 flex items-center gap-2">
          <Package className="w-6 h-6 text-elite-burgundy" />
          Your Items ({order.items.length})
        </h2>
        
        <div className="space-y-4">
          {order.items.map((item) => {
            const itemName = item.menuItem?.name || "Unknown Item";
            const itemImage = item.menuItem?.images && item.menuItem.images.length > 0
              ? getFirstValidImage(item.menuItem.images)
              : "/images/placeholder.svg";

            return (
              <div 
                key={item.id} 
                className="flex gap-4 pb-4 border-b-2 border-elite-burgundy/5 last:border-0 touch-manipulation"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-elite-cream/50 flex-shrink-0 ring-2 ring-elite-burgundy/10">
                  <ImageWithFallback
                    src={itemImage}
                    alt={itemName}
                    fill={true}
                    className="object-cover"
                    fallbackSrc="/images/placeholder.svg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-calistoga text-base sm:text-lg text-elite-black mb-1 line-clamp-2">
                    {itemName}
                  </h3>
                  
                  {/* Attributes */}
                  {item.attributes && typeof item.attributes === 'object' && 'formatted' in item.attributes && Array.isArray(item.attributes.formatted) && item.attributes.formatted.length > 0 && (
                    <p className="font-cabin text-xs text-elite-black/50 mb-2 line-clamp-1">
                      {item.attributes.formatted.join(" • ")}
                    </p>
                  )}
                  
                  <div className="flex items-end justify-between gap-2">
                    <div className="font-cabin text-sm text-elite-black/60">
                      <span className="font-semibold">EGP {item.unitPrice.toFixed(2)}</span>
                      <span className="mx-2">×</span>
                      <span>{item.quantity}</span>
                    </div>
                    <p className="font-calistoga text-lg text-elite-burgundy">
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
            <span className="font-semibold">EGP {order.subtotal.toFixed(2)}</span>
          </div>
          
          {order.deliveryFee > 0 && (
            <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Fee
              </span>
              <span className="font-semibold">EGP {order.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          {order.codFee > 0 && (
            <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-black/70">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                COD Fee
              </span>
              <span className="font-semibold">EGP {order.codFee.toFixed(2)}</span>
            </div>
          )}
          
          {order.discount > 0 && (
            <div className="flex justify-between items-center font-cabin text-sm sm:text-base text-elite-burgundy">
              <span>Discount</span>
              <span className="font-bold">-EGP {order.discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center font-cabin text-lg sm:text-xl font-bold text-elite-black pt-3 border-t-2 border-elite-burgundy/10">
            <span>Total</span>
            <span className="text-elite-burgundy">EGP {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Need Help & Actions Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Need Help */}
        <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 rounded-3xl shadow-lg p-5 sm:p-6 text-elite-cream">
          <h3 className="font-calistoga text-lg sm:text-xl mb-2">Need Help?</h3>
          <p className="font-cabin text-sm text-elite-cream/80 mb-4">
            Questions about your order? We're here to help.
          </p>
          <button className="w-full px-6 py-3 bg-elite-cream text-elite-burgundy rounded-2xl font-cabin font-bold text-base hover:bg-elite-cream/90 transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Support
          </button>
        </div>

        {/* Reorder */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6">
          <h3 className="font-calistoga text-lg sm:text-xl text-elite-black mb-2">Loved It?</h3>
          <p className="font-cabin text-sm text-elite-black/60 mb-4">
            Order the same items again with one click.
          </p>
          <Link
            href="/menu"
            className="w-full px-6 py-3 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Reorder
          </Link>
        </div>
      </div>
    </div>
  );
}
