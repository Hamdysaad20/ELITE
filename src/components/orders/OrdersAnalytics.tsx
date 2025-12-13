"use client";

import { TrendingUp, Package, Clock, CheckCircle2, Sparkles, Star } from "lucide-react";
import { OrderStatus } from "@/types";
import { useUserSavings, useUserPoints } from "@/hooks/useAnalytics";

interface OrdersAnalyticsProps {
  orders: any[];
}

export function OrdersAnalytics({ orders }: OrdersAnalyticsProps) {
  const { savings } = useUserSavings();
  const { points } = useUserPoints();

  if (!orders || orders.length === 0) {
    return null;
  }

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const activeOrders = orders.filter(order => 
    order.status !== OrderStatus.DELIVERED && 
    order.status !== OrderStatus.CANCELLED
  ).length;
  const completedOrders = orders.filter(order => 
    order.status === OrderStatus.DELIVERED
  ).length;

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 sm:p-6">
      <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-elite-burgundy" />
        Order Overview
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-elite-cream/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-elite-burgundy" />
            <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
              Total Orders
            </p>
          </div>
          <p className="font-calistoga text-2xl sm:text-3xl text-elite-black">
            {totalOrders}
          </p>
        </div>

        {/* Total Spent */}
        <div className="bg-elite-cream/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-elite-burgundy" />
            <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
              Total Spent
            </p>
          </div>
          <p className="font-calistoga text-2xl sm:text-3xl text-elite-black">
            {totalSpent.toFixed(0)}
            <span className="text-sm ml-1">EGP</span>
          </p>
        </div>

        {/* Total Saved */}
        <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-elite-cream" />
            <p className="font-cabin text-xs text-elite-cream/80 font-semibold uppercase tracking-wide">
              Total Saved
            </p>
          </div>
          <p className="font-calistoga text-2xl sm:text-3xl text-elite-cream">
            {savings?.totalSaved.toFixed(0) || 0}
            <span className="text-sm ml-1">EGP</span>
          </p>
        </div>

        {/* Points Balance */}
        <div className="bg-elite-cream/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-elite-burgundy" />
            <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
              Points Balance
            </p>
          </div>
          <p className="font-calistoga text-2xl sm:text-3xl text-elite-burgundy">
            {points?.totalPoints.toLocaleString() || 0}
          </p>
        </div>

        {/* Active Orders */}
        <div className="bg-elite-cream/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-elite-burgundy" />
            <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
              Active
            </p>
          </div>
          <p className="font-calistoga text-2xl sm:text-3xl text-elite-black">
            {activeOrders}
          </p>
        </div>

        {/* Completed Orders */}
        <div className="bg-elite-cream/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-elite-burgundy" />
            <p className="font-cabin text-xs text-elite-black/50 font-semibold uppercase tracking-wide">
              Completed
            </p>
          </div>
          <p className="font-calistoga text-2xl sm:text-3xl text-elite-black">
            {completedOrders}
          </p>
        </div>
      </div>
    </div>
  );
}
