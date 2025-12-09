"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { useOrders } from "@/hooks/useOrderStatus";
import { OrderStatusBadge, OrderIntegrationStatus } from "@/components/OrderStatusBadge";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Loader2, AlertCircle, Package, RefreshCw, ShoppingBag, Clock } from "lucide-react";
import { useSwipeBack } from "@/hooks/useSwipeBack";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { orders, loading, error, refetch } = useOrders();

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  if (authLoading || loading) {
    return (
      <main>
        <Navigation />
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin mb-4" />
            <p className="text-elite-black/70 font-cabin text-lg">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block">
        <Navigation />
      </div>
      <MobileHeader title="My Orders" showBack={true} />
      <div className="min-h-screen bg-elite-cream pb-20 md:pb-0 pt-16 md:pt-0">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
              <Package className="w-8 h-8 sm:w-10 sm:h-10" />
              <div>
                <h1 className="font-calistoga text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">
                  My Orders
                </h1>
                <p className="font-cabin text-elite-cream/90 text-sm sm:text-base">
                  Track your order history and status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 text-center mb-6 sm:mb-8">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-red-900 font-calistoga text-lg sm:text-xl mb-2">Unable to Load Orders</h3>
              <p className="text-red-700 font-cabin text-sm sm:text-base mb-4">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all touch-manipulation active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!error && !loading && orders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <ShoppingBag className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-900 font-calistoga text-xl sm:text-2xl mb-2">No Orders Yet</h3>
              <p className="text-gray-600 font-cabin text-sm sm:text-base mb-6">
                You haven't placed any orders yet. Start exploring our menu!
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                Browse Menu
              </Link>
            </div>
          )}

          {/* Orders List */}
          {!error && !loading && orders.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-elite-burgundy hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.99] touch-manipulation"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-elite-burgundy/5 to-elite-dark-burgundy/5 p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-calistoga text-lg sm:text-xl text-elite-black mb-1">
                          Order #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600 font-cabin">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} size="md" />
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Order Number</p>
                        <p className="font-cabin font-semibold text-elite-black">
                          {order.orderNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="font-cabin font-semibold text-elite-black">
                          {order.total} EGP
                        </p>
                      </div>
                    </div>

                    {/* Odoo Integration Status */}
                    {order.integrationStatus && (
                      <div className="pt-4 border-t border-gray-200">
                        <OrderIntegrationStatus integrationStatus={order.integrationStatus} />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileNavigation />
    </>
  );
}


