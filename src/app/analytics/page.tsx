"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { useUserSavings, useUserPoints } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrderStatus";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { Loader2, TrendingUp, Award, Download } from "lucide-react";
import { SavingsCard } from "@/components/analytics/SavingsCard";
import { PointsCard } from "@/components/analytics/PointsCard";
import { SavingsChart } from "@/components/analytics/SavingsChart";
import { PointsChart } from "@/components/analytics/PointsChart";
import { SpendingChart } from "@/components/analytics/SpendingChart";
import { fetchAndExportAnalytics } from "@/lib/analytics/exportPDF";
import Link from "next/link";
import { useState } from "react";

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { savings, loading: savingsLoading } = useUserSavings();
  const { points, loading: pointsLoading } = useUserPoints();
  const { orders, loading: ordersLoading } = useOrders();
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });
  const [exporting, setExporting] = useState(false);

  const loading = authLoading || savingsLoading || pointsLoading || ordersLoading;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await fetchAndExportAnalytics();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export analytics. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <MobileHeader title="Analytics" showBack={true} />
        <main className="min-h-screen bg-elite-cream flex items-center justify-center pt-16 md:pt-0">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-elite-burgundy animate-spin mb-4" />
            <p className="text-elite-black/70 font-cabin text-lg">Loading analytics...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Prepare chart data from savings
  const savingsChartData = savings?.savingsByMonth?.slice(-6).map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    savings: item.amount,
    spending: 0 // Will be calculated from orders
  })) || [];

  // Calculate spending by month from orders
  const spendingByMonth = orders?.reduce((acc: any, order: any) => {
    const month = new Date(order.createdAt).toISOString().slice(0, 7);
    if (!acc[month]) acc[month] = 0;
    acc[month] += Number(order.total);
    return acc;
  }, {}) || {};

  // Merge spending data into chart data
  const spendingChartData = savingsChartData.map((item: any, index: number) => {
    const monthKey = Object.keys(spendingByMonth)[index];
    return {
      ...item,
      spending: spendingByMonth[monthKey] || 0
    };
  });

  // Calculate points earned by month
  const pointsChartData = savings?.savingsByMonth?.slice(-6).map((item: any) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    earned: item.amount * 100, // Rough estimate: savings to points
    redeemed: 0
  })) || [];

  // Calculate percentage change for savings
  const lastMonthSavings = savings?.savingsByMonth?.slice(-2)[0]?.amount || 0;
  const currentMonthSavings = savings?.savingsByMonth?.slice(-1)[0]?.amount || 0;
  const percentageChange = lastMonthSavings > 0 
    ? ((currentMonthSavings - lastMonthSavings) / lastMonthSavings) * 100 
    : 0;

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <MobileHeader title="Analytics" showBack={true} />
      
      <main className="min-h-screen bg-elite-cream pb-32 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-4 md:space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-calistoga text-2xl sm:text-3xl text-elite-black flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-elite-burgundy" />
                Your Analytics
              </h1>
              <p className="font-cabin text-elite-black/60 mt-1">
                Track your savings, points, and spending habits
              </p>
            </div>
            
            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-semibold hover:bg-elite-burgundy/90 active:scale-95 transition-all disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </button>
          </div>

          {/* Mobile Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-semibold hover:bg-elite-burgundy/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Analytics as PDF
              </>
            )}
          </button>

          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Savings */}
            <SavingsCard 
              totalSaved={savings?.totalSaved || 0}
              percentageChange={percentageChange}
              period="last month"
            />

            {/* Points Balance */}
            <PointsCard 
              balance={points?.totalPoints || 0}
              tier={points?.tier || 'bronze'}
              nextTierAt={points?.nextTierAt || 100000}
              pointsToNextTier={points?.pointsToNextTier}
            />

            {/* Average Savings */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-6 h-6 text-elite-burgundy" />
                <h3 className="font-calistoga text-xl text-elite-black">Avg. Savings</h3>
              </div>
              <p className="font-calistoga text-4xl text-elite-burgundy mb-1">
                {savings?.averageSavingsPerOrder.toFixed(0) || 0}
                <span className="text-sm ml-1 text-elite-black/60">EGP</span>
              </p>
              <p className="text-sm text-elite-black/60 font-cabin">
                per order
              </p>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-6 h-6 text-elite-burgundy" />
                <h3 className="font-calistoga text-xl text-elite-black">Total Orders</h3>
              </div>
              <p className="font-calistoga text-4xl text-elite-black mb-1">
                {orders?.length || 0}
              </p>
              <p className="text-sm text-elite-black/60 font-cabin">
                lifetime orders
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SavingsChart data={savingsChartData} />
            <PointsChart data={pointsChartData} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 gap-4">
            <SpendingChart data={spendingChartData} />
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-6">
            <h3 className="font-calistoga text-xl text-elite-black mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/points/history"
                className="p-4 bg-elite-cream rounded-2xl hover:bg-elite-burgundy/5 transition-colors group"
              >
                <h4 className="font-cabin font-semibold text-elite-black group-hover:text-elite-burgundy transition-colors">
                  View Points History
                </h4>
                <p className="text-sm text-elite-black/60 mt-1 font-cabin">
                  See all your point transactions
                </p>
              </Link>
              <Link
                href="/orders"
                className="p-4 bg-elite-cream rounded-2xl hover:bg-elite-burgundy/5 transition-colors group"
              >
                <h4 className="font-cabin font-semibold text-elite-black group-hover:text-elite-burgundy transition-colors">
                  View All Orders
                </h4>
                <p className="text-sm text-elite-black/60 mt-1 font-cabin">
                  Browse your order history
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
