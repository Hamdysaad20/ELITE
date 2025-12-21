"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, LogOut, ShoppingBag, MapPin, Package, Award, Settings, Camera } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import AddressManager from "@/components/AddressManager";
import AvatarUpload from "@/components/AvatarUpload";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useOrders } from "@/hooks/useOrderStatus";
import { useRequireAuth } from "@/lib/auth/hooks";
import Image from "next/image";
import Link from "next/link";
import { OrdersAnalytics } from "@/components/orders/OrdersAnalytics";
import { OrdersList } from "@/components/orders/OrdersList";

type TabType = "orders" | "addresses" | "rewards" | "settings";

function ProfileContent() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  
  // Fetch orders data
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrders();

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && ["orders", "addresses", "rewards", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
      // Scroll to top of page when navigating via URL parameter
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tabs = [
    { id: "orders" as TabType, label: "Orders", icon: ShoppingBag },
    { id: "addresses" as TabType, label: "Addresses", icon: MapPin },
    { id: "rewards" as TabType, label: "Rewards", icon: Award, comingSoon: true },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block">
      </div>
      <MobileHeader title="Profile" showBack={true} />
      
      <main className="min-h-screen bg-elite-cream pb-28 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 md:pt-12 space-y-3 md:space-y-6">
          
          {/* Profile Header - Premium rounded design */}
          <div className="bg-white rounded-3xl shadow-lg border border-elite-burgundy/10 overflow-hidden">
            <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center shadow-lg ring-2 ring-elite-cream/30 overflow-hidden">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-calistoga text-xl sm:text-2xl md:text-3xl text-elite-burgundy">
                        {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute inset-0 rounded-full bg-black/0 active:bg-black/40 md:hover:bg-black/40 transition-all flex items-center justify-center opacity-0 active:opacity-100 md:hover:opacity-100 touch-manipulation"
                    title="Change profile picture"
                  >
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
                  </button>
                </div>
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="font-calistoga text-lg sm:text-xl md:text-2xl text-elite-cream truncate leading-tight">
                    {session.user?.name || session.user?.email?.split('@')[0] || "User"}
                  </h1>
                  <div className="flex items-center gap-1.5 text-elite-cream/70 mt-0.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <p className="font-cabin text-xs sm:text-sm truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Bar - Compact */}
            <div className="bg-elite-cream/40 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-around">
              <div className="text-center">
                <p className="font-calistoga text-lg sm:text-xl text-elite-burgundy">{orders.length}</p>
                <p className="font-cabin text-[11px] sm:text-xs text-elite-black/50 uppercase tracking-wide">Orders</p>
              </div>
              <div className="w-px h-8 bg-elite-burgundy/15" />
              <div className="text-center">
                <p className="font-calistoga text-lg sm:text-xl text-elite-burgundy">0</p>
                <p className="font-cabin text-[11px] sm:text-xs text-elite-black/50 uppercase tracking-wide">Points</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Rounded pill style */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-elite-burgundy/10 p-2">
            <div className="flex items-center gap-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                    disabled={tab.comingSoon}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-cabin font-semibold transition-all duration-200 relative touch-manipulation ${
                      isActive
                        ? "text-elite-cream bg-elite-burgundy shadow-md"
                        : "text-elite-black/50 active:bg-elite-cream/50"
                    } ${tab.comingSoon ? "opacity-40" : ""}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-5 sm:h-5 ${isActive ? "" : ""}`} />
                    <span className="text-[10px] sm:text-xs">{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-elite-burgundy rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {/* Quick Links Row */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4 text-elite-burgundy" />
                    <span className="font-cabin text-sm font-semibold text-elite-black">View All</span>
                  </Link>
                  <Link
                    href="/analytics"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-elite-burgundy text-elite-cream hover:bg-elite-burgundy/90 transition-all whitespace-nowrap"
                  >
                    <Package className="w-4 h-4" />
                    <span className="font-cabin text-sm font-semibold">Analytics</span>
                  </Link>
                </div>

                {/* Orders Analytics */}
                <OrdersAnalytics orders={orders} />

                {/* Orders List */}
                <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-4 sm:p-5">
                  <OrdersList 
                    orders={orders} 
                    loading={ordersLoading} 
                    error={ordersError} 
                    onRetry={refetchOrders}
                    compact={true}
                    maxItems={3}
                    showViewAll={true}
                  />
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border-2 border-elite-burgundy/10">
                <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black mb-5">Delivery Addresses</h2>
                <AddressManager />
              </div>
            )}

            {/* Rewards Tab (Coming Soon) */}
            {activeTab === "rewards" && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border-2 border-elite-burgundy/10">
                <div className="text-center py-16 sm:py-20">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-elite-burgundy/10 flex items-center justify-center mx-auto mb-6">
                    <Award className="w-10 h-10 sm:w-12 sm:h-12 text-elite-burgundy" />
                  </div>
                  <h2 className="font-calistoga text-2xl text-elite-black mb-3">Rewards Program</h2>
                  <p className="font-cabin text-elite-black/60 max-w-md mx-auto">
                    Earn points with every purchase and unlock exclusive benefits
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab (Coming Soon) */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border-2 border-elite-burgundy/10">
                <div className="text-center py-16 sm:py-20">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-elite-burgundy/10 flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-10 h-10 sm:w-12 sm:h-12 text-elite-burgundy" />
                  </div>
                  <h2 className="font-calistoga text-2xl text-elite-black mb-3">Account Settings</h2>
                  <p className="font-cabin text-elite-black/60 max-w-md mx-auto mb-6">
                    Manage your preferences and account details
                  </p>
                  <button
                    onClick={() => router.push("/settings")}
                    className="bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full mt-4 bg-white text-red-600 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-red-100 hover:border-red-200 active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-cabin font-semibold">Sign Out</span>
          </button>
        </div>
      </main>

      
      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <AvatarUpload
          onClose={() => setShowAvatarUpload(false)}
          currentImage={session?.user?.image}
        />
      )}
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
