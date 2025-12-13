"use client";

import { useState, useMemo } from "react";
import { useRequireAuth } from "@/lib/auth/hooks";
import { useOrders } from "@/hooks/useOrderStatus";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Loader2, ShoppingBag, Home } from "lucide-react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { OrdersAnalytics } from "@/components/orders/OrdersAnalytics";
import { OrdersList } from "@/components/orders/OrdersList";
import { OrderFilters, type OrderFilters as OrderFiltersType } from "@/components/orders/OrderFilters";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { orders, loading, error, refetch } = useOrders();

  // Filter state
  const [filters, setFilters] = useState<OrderFiltersType>({
    status: [],
    dateRange: { start: null, end: null, preset: 'all' },
    orderType: 'all',
    priceRange: { min: 0, max: 10000 },
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = [...orders];

    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(order => filters.status.includes(order.status));
    }

    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= filters.dateRange.start! && orderDate <= filters.dateRange.end!;
      });
    }

    // Filter by order type
    if (filters.orderType !== 'all') {
      filtered = filtered.filter(order => order.orderType === filters.orderType);
    }

    // Sort orders
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'price':
          comparison = Number(a.total) - Number(b.total);
          break;
        case 'savings':
          // TODO: Add savings comparison when data is available
          comparison = 0;
          break;
        case 'points':
          comparison = (a.pointsEarned || 0) - (b.pointsEarned || 0);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, filters]);

  if (authLoading || loading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title="My Orders" showBack={true} />
        <main className="min-h-screen bg-elite-cream flex items-center justify-center pt-16 md:pt-0">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin mb-4" />
            <p className="text-elite-black/70 font-cabin text-lg">Loading your orders...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <MobileHeader title="My Orders" showBack={true} />
      
      <main className="min-h-screen bg-elite-cream pb-32 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-4 md:space-y-6">
          
          {/* Quick Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
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
            
            {/* Filters */}
            <OrderFilters 
              filters={filters} 
              onFilterChange={setFilters} 
              orderCount={filteredOrders.length}
            />
          </div>

          {/* Analytics Overview */}
          <OrdersAnalytics orders={filteredOrders} />

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
