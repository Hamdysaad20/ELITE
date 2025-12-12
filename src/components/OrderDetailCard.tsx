"use client";

import { useOrder } from "@/hooks/useOrder";
import { OrderStatus, OrderType } from "@/types";
import { Loader2, Truck, Clock, CheckCircle2, Package, MapPin, Copy } from "lucide-react";
import { useState } from "react";
import ImageWithFallback from "./ui/ImageWithFallback";
import { getFirstValidImage } from "@/lib/imageUtils";
import { apiClient } from "@/lib/auth/apiClient";

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
 * Get timeline events based on order status
 */
function getTimelineEvents(status: string, createdAt: Date | string, updatedAt: Date | string) {
  // Ensure dates are Date objects
  const createdDate = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const updatedDate = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  
  const events = [
    {
      date: createdDate,
      title: "Order placed",
      description: "Your order has been received",
      completed: true,
      current: false,
    },
  ];

  // Map statuses to timeline events
  // We group PREPARING, READY, and OUT_FOR_DELIVERY as "working on it"
  // CONFIRMED is treated as "working on it" since it's the next step after pending
  const statusMap: Record<string, { title: string; description: string }> = {
    [OrderStatus.CONFIRMED]: {
      title: "Working on it",
      description: "Your order has been confirmed",
    },
    [OrderStatus.PREPARING]: {
      title: "Working on it",
      description: "We're preparing your order",
    },
    [OrderStatus.READY]: {
      title: "Working on it",
      description: "Your order is being prepared",
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      title: "Working on it",
      description: "Your order is on the way",
    },
    [OrderStatus.DELIVERED]: {
      title: "Done",
      description: "Your order has been delivered",
    },
    [OrderStatus.CANCELLED]: {
      title: "Cancelled",
      description: "Your order has been cancelled",
    },
  };

  const statusInfo = statusMap[status];
  if (statusInfo) {
    events.push({
      date: updatedDate,
      title: statusInfo.title,
      description: statusInfo.description,
      completed: status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED,
      current: status !== OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED,
    });
  }

  return events;
}

/**
 * Get status badge color and text
 * Simplified to: Pending, Working on it, Done, Cancelled
 */
function getStatusInfo(status: string): { text: string; color: string; bgColor: string } {
  const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
    [OrderStatus.PENDING]: {
      text: "Pending",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
    },
    [OrderStatus.CONFIRMED]: {
      text: "Working on it",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
    [OrderStatus.PREPARING]: {
      text: "Working on it",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
    [OrderStatus.READY]: {
      text: "Working on it",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      text: "Working on it",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
    [OrderStatus.DELIVERED]: {
      text: "Done",
      color: "text-green-700",
      bgColor: "bg-green-100",
    },
    [OrderStatus.CANCELLED]: {
      text: "Cancelled",
      color: "text-red-700",
      bgColor: "bg-red-100",
    },
  };

  return statusMap[status] || {
    text: status,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  };
}

/**
 * Component to display order details in a user-friendly way
 * Based on Dribbble design - customer-focused, no admin information
 */
export function OrderDetailCard({ orderId }: OrderDetailCardProps) {
  const { order, loading, error, refetch } = useOrder(orderId);
  const [copiedTracking, setCopiedTracking] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-elite-burgundy animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-800 font-cabin text-center">{error}</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // Ensure dates are Date objects (handle both Date and string)
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
  const updatedAt = order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt);
  
  const statusInfo = getStatusInfo(order.status);
  const estimatedDelivery = getEstimatedDeliveryDate(createdAt, order.status);
  const timelineEventsRaw = getTimelineEvents(order.status, createdAt, updatedAt);
  // Ensure all event dates are Date objects
  const timelineEvents = timelineEventsRaw.map(event => ({
    ...event,
    date: event.date instanceof Date ? event.date : new Date(event.date),
  }));
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-calistoga text-3xl md:text-4xl text-elite-black mb-2">
              Order Detail
            </h1>
            <p className="font-cabin text-gray-600">Order ID: #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-cabin font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Delivery Status Cards */}
      {isInProgress && order.orderType === OrderType.DELIVERY && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-cabin font-semibold text-gray-800">Be patient, package on deliver!</p>
                <p className="font-cabin text-sm text-gray-500 mt-1">
                  {order.address?.city || "Location"} → {order.address?.street || "Destination"}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getDeliveryProgress()}%` }}
              />
            </div>
          </div>

          {/* Estimated Arrival */}
          {estimatedDelivery && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-cabin text-sm text-gray-500">Estimated Arrival</p>
                  <p className="font-cabin font-semibold text-gray-800">
                    {estimatedDelivery.toLocaleDateString('en-US', {
                      day: 'numeric',
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
          </div>
        )}

          {/* Delivery Time */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-green-500" />
          <div>
                <p className="font-cabin text-sm text-gray-500">Delivered in</p>
                <p className="font-cabin font-semibold text-gray-800">
                  {estimatedDelivery
                    ? Math.ceil((estimatedDelivery.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 3}{" "}
                  Days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="font-calistoga text-2xl text-elite-black mb-6">Timeline</h2>
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      event.completed
                        ? "bg-green-500"
                        : event.current
                        ? "bg-orange-500 ring-2 ring-orange-200"
                        : "bg-gray-300"
                    }`}
                  />
                  {index < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-cabin font-semibold text-gray-800">{event.title}</p>
                    {event.completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="font-cabin text-sm text-gray-500 mb-1">{event.description}</p>
                  <p className="font-cabin text-xs text-gray-400">
                    {(() => {
                      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                      return eventDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      }) + " " + eventDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    })()}
                    {event.current && (
                      <span className="ml-2 text-orange-500">• Now</span>
                    )}
                  </p>
                  {order.address && event.current && (
                    <p className="font-cabin text-xs text-gray-400 mt-1">
                      {order.address.city}, {order.address.state || ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Details */}
        {order.orderType === OrderType.DELIVERY && order.address && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="font-calistoga text-2xl text-elite-black mb-6">Shipment</h2>
            <div className="space-y-4">
              <div>
                <p className="font-cabin text-sm text-gray-500 mb-1">Courier</p>
                <p className="font-cabin font-semibold text-gray-800">Elite Delivery</p>
                <p className="font-cabin text-xs text-gray-400 mt-1">
                  {order.address.city}, {order.address.state || ""}
                </p>
              </div>
              <div>
                <p className="font-cabin text-sm text-gray-500 mb-1">Recipient</p>
                <p className="font-cabin font-semibold text-gray-800">
                  {order.address.label || "Customer"}
                </p>
              </div>
              <div>
                <p className="font-cabin text-sm text-gray-500 mb-1">Delivery address</p>
                <p className="font-cabin text-gray-800">
                  {order.address.street}
                  {order.address.apartment && `, ${order.address.apartment}`}
                  <br />
                  {order.address.city}
                  {order.address.state && `, ${order.address.state}`}
                  {order.address.zipCode && ` ${order.address.zipCode}`}
                </p>
              </div>
              <div>
                <p className="font-cabin text-sm text-gray-500 mb-1">Tracking No.</p>
                <div className="flex items-center gap-2">
                  <p className="font-cabin font-mono text-gray-800">{order.id.slice(0, 12).toUpperCase()}</p>
                  <button
                    onClick={copyTrackingNumber}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy tracking number"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  {copiedTracking && (
                    <span className="text-xs text-green-600 font-cabin">Copied!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Items Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="font-calistoga text-2xl text-elite-black mb-6">
          Items {order.items.length}
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            // Get item name from menuItem or fallback
            const itemName = item.menuItem?.name || "Unknown Item";
            const itemImage = item.menuItem?.images && item.menuItem.images.length > 0
              ? getFirstValidImage(item.menuItem.images)
              : "/images/placeholder.svg";

            return (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <ImageWithFallback
                    src={itemImage}
                    alt={itemName}
                    fill={true}
                    className="object-cover"
                    fallbackSrc="/images/placeholder.svg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-cabin font-semibold text-gray-800 mb-1">{itemName}</h3>
                  <div className="flex items-center justify-between">
                    <p className="font-cabin text-gray-600">
                      EGP {item.unitPrice.toFixed(2)} x{item.quantity}
                    </p>
                    <p className="font-cabin font-semibold text-elite-burgundy">
                      EGP {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  {/* Show attributes if available */}
                  {item.attributes && typeof item.attributes === 'object' && 'formatted' in item.attributes && Array.isArray(item.attributes.formatted) && item.attributes.formatted.length > 0 && (
                    <p className="font-cabin text-xs text-gray-500 mt-1">
                      {item.attributes.formatted.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          <div className="flex justify-between font-cabin text-gray-600">
            <span>Subtotal</span>
            <span>EGP {order.subtotal.toFixed(2)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between font-cabin text-gray-600">
              <span>Delivery Fee</span>
              <span>EGP {order.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          {order.codFee > 0 && (
            <div className="flex justify-between font-cabin text-gray-600">
              <span>COD Fee</span>
              <span>EGP {order.codFee.toFixed(2)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between font-cabin text-green-600">
              <span>Discount</span>
              <span>-EGP {order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-cabin font-bold text-lg text-elite-black pt-3 border-t border-gray-200">
            <span>Total</span>
            <span className="text-elite-burgundy">EGP {order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Order Date */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="font-cabin text-sm text-gray-500">
            Order placed on{" "}
            {createdAt.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          </div>
      </div>
    </div>
  );
}
