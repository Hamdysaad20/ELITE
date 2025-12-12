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
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useRequireAuth } from "@/lib/auth/hooks";
import Image from "next/image";

type TabType = "orders" | "addresses" | "rewards" | "settings";

function ProfileContent() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const { purchases, loading: purchasesLoading } = useUserPurchases();

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
      
      <main className="min-h-screen bg-elite-cream pb-32 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-12 space-y-4 md:space-y-6">
          
          {/* Profile Header - Compact */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
            <div className="bg-elite-burgundy p-5 sm:p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-xl ring-4 ring-elite-cream/20 overflow-hidden">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-calistoga text-2xl sm:text-3xl text-elite-burgundy">
                        {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                    title="Change profile picture"
                  >
                    <Camera className="w-6 h-6 text-white drop-shadow-lg" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-calistoga text-xl sm:text-2xl text-elite-cream truncate">
                    {session.user?.name || session.user?.email?.split('@')[0] || "User"}
                  </h1>
                  <div className="flex items-center gap-2 text-elite-cream/80 mt-1">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <p className="font-cabin text-sm truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="bg-elite-cream/50 px-5 sm:px-6 py-5 flex items-center justify-around border-t border-elite-burgundy/10">
              <div className="text-center">
                <p className="font-calistoga text-xl text-elite-burgundy">{purchases.length}</p>
                <p className="font-cabin text-xs text-elite-black/60">Orders</p>
              </div>
              <div className="w-px h-10 bg-elite-burgundy/20" />
              <div className="text-center">
                <p className="font-calistoga text-xl text-elite-burgundy">0</p>
                <p className="font-cabin text-xs text-elite-black/60">Points</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
            <div className="flex items-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                    disabled={tab.comingSoon}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 px-3 sm:px-4 py-5 font-cabin font-semibold transition-all duration-300 relative ${
                      isActive
                        ? "text-elite-burgundy bg-elite-cream/30"
                        : "text-elite-black/60 hover:text-elite-black hover:bg-elite-cream/20"
                    } ${tab.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="absolute top-1 right-1 text-[9px] bg-elite-burgundy text-elite-cream px-1.5 py-0.5 rounded-full font-bold">
                        SOON
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-elite-burgundy" />
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
              <div className="bg-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border-2 border-elite-burgundy/10">
                <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black mb-5">Your Orders</h2>
                {purchasesLoading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent mx-auto mb-4"></div>
                    <p className="font-cabin text-elite-black/60">Loading orders...</p>
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-elite-burgundy/10 flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="w-10 h-10 text-elite-burgundy/40" />
                    </div>
                    <p className="font-cabin text-elite-black/60 text-lg mb-2">No orders yet</p>
                    <p className="font-cabin text-elite-black/40 text-sm mb-6">Start your coffee journey today</p>
                    <button
                      onClick={() => router.push("/menu")}
                      className="bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Place Your First Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((purchase) => (
                      <div
                        key={purchase.productId}
                        className="flex items-center gap-3 sm:gap-4 p-4 sm:p-4 bg-elite-cream/30 rounded-2xl border-2 border-elite-burgundy/10 hover:border-elite-burgundy/20 hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-elite-burgundy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin font-bold text-elite-black truncate">
                            {purchase.productName}
                          </p>
                          <p className="font-cabin text-sm text-elite-black/60">
                            {new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/menu`)}
                          className="flex-shrink-0 text-xs sm:text-sm font-bold text-elite-burgundy hover:text-elite-cream bg-elite-burgundy/10 hover:bg-elite-burgundy px-4 py-2.5 rounded-full transition-all duration-300 active:scale-95"
                        >
                          Reorder
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
