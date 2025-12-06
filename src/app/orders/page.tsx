"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { useOrders } from "@/hooks/useOrderStatus";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Loader2, AlertCircle, Package, RefreshCw, ShoppingBag } from "lucide-react";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { orders, loading, error, refetch } = useOrders();

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
    <main>
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-4">
              <Package className="w-10 h-10" />
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                  My Orders
                </h1>
                <p className="font-cabin text-elite-cream/90">
                  Track your order history and status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-red-900 font-calistoga text-xl mb-2">Unable to Load Orders</h3>
              <p className="text-red-700 font-cabin mb-4">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!error && !loading && orders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-900 font-calistoga text-2xl mb-2">No Orders Yet</h3>
              <p className="text-gray-600 font-cabin mb-6">
                You haven't placed any orders yet. Start exploring our menu!
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all transform hover:scale-105"
              >
                Browse Menu
              </Link>
            </div>
          )}

          {/* Orders List */}
          {!error && !loading && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-elite-burgundy hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-elite-burgundy/5 to-elite-dark-burgundy/5 p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-calistoga text-xl text-elite-black mb-1">
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
                        <p className="text-xs text-gray-500 mb-1">Items</p>
                        <p className="font-cabin font-semibold text-elite-black">
                          {order.items?.length || 0} items
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

                    {/* Polling Indicator */}
                    {isPolling && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>Checking for updates...</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}


