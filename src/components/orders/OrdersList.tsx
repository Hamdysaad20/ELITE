"use client";

import Link from "next/link";
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderStatus } from "@/types";

interface OrdersListProps {
  orders: any[];
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
  // Loading State
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent mx-auto mb-4" />
        <p className="font-cabin text-elite-black/60">Loading orders...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border-2 border-elite-burgundy/20 rounded-3xl p-6 sm:p-8 text-center">
        <AlertCircle className="w-12 h-12 text-elite-burgundy mx-auto mb-4" />
        <h3 className="text-elite-black font-calistoga text-xl sm:text-2xl mb-2">Unable to Load Orders</h3>
        <p className="text-elite-black/70 font-cabin text-sm sm:text-base mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-3 rounded-2xl font-cabin font-bold hover:bg-elite-burgundy/90 transition-all touch-manipulation active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty State
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-8 sm:p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-elite-cream flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-elite-burgundy" />
        </div>
        <h3 className="text-elite-black font-calistoga text-2xl sm:text-3xl mb-3">No Orders Yet</h3>
        <p className="text-elite-black/60 font-cabin text-sm sm:text-base mb-8 max-w-md mx-auto">
          Start your journey with us! Explore our delicious menu and place your first order.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-2xl font-cabin font-bold hover:bg-elite-burgundy/90 transition-all transform hover:scale-105 active:scale-95 touch-manipulation shadow-lg"
        >
          <ShoppingBag className="w-5 h-5" />
          Browse Menu
        </Link>
      </div>
    );
  }

  // Display orders (with optional limit)
  const displayOrders = maxItems ? orders.slice(0, maxItems) : orders;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black">
            {showViewAll ? "Recent Orders" : "Your Orders"}
          </h2>
          <p className="font-cabin text-sm text-elite-black/50">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {displayOrders.map((order) => {
          const isActive = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;
          
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.99] touch-manipulation group"
            >
              {/* Order Header */}
              <div className="bg-elite-cream/30 p-4 sm:p-5 border-b-2 border-elite-burgundy/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-elite-burgundy' : 'bg-elite-cream'
                    }`}>
                      {isActive ? (
                        <Clock className="w-6 h-6 text-elite-cream" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-elite-burgundy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-calistoga text-base sm:text-lg text-elite-black mb-1 truncate">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-xs sm:text-sm text-elite-black/60 font-cabin">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
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
                      Order Number
                    </p>
                    <p className="font-cabin font-bold text-elite-black text-sm">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-elite-black/50 mb-1 font-cabin font-semibold uppercase tracking-wide">
                      Total
                    </p>
                    <p className="font-calistoga text-lg text-elite-burgundy">
                      {order.total} EGP
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="pt-3 border-t-2 border-elite-burgundy/5">
                  <div className="flex items-center justify-between text-elite-burgundy group-hover:text-elite-burgundy/80 transition-colors">
                    <span className="font-cabin text-sm font-bold">View Details</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View All Link */}
      {showViewAll && maxItems && orders.length > maxItems && (
        <Link
          href="/orders"
          className="block text-center py-4 text-elite-burgundy font-cabin font-bold hover:text-elite-burgundy/80 transition-colors"
        >
          View All Orders ({orders.length})
        </Link>
      )}
    </div>
  );
}
