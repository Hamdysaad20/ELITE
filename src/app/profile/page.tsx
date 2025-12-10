"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, LogOut, ShoppingBag, Heart, Settings, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNavigation from "@/components/MobileNavigation";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Navigation from "@/components/Navigation";
import AddressManager from "@/components/AddressManager";
import { useSwipeBack } from "@/hooks/useSwipeBack";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAddresses, setShowAddresses] = useState(false);

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/profile");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      label: "My Orders",
      href: "/orders",
      description: "View order history",
    },
    {
      icon: MapPin,
      label: "Delivery Addresses",
      onClick: () => setShowAddresses(!showAddresses),
      description: "Manage delivery locations",
      isExpanded: showAddresses,
    },
    {
      icon: Heart,
      label: "Favorites",
      href: "/favorites",
      description: "Saved items",
      comingSoon: true,
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      description: "App preferences",
      comingSoon: true,
    },
  ];

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block">
        <Navigation />
      </div>
      <MobileHeader title="Profile" showBack={true} />
      
      <main className="min-h-screen bg-elite-cream pb-20 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-12">
          {/* Profile Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-elite-burgundy/10 mb-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center shadow-xl">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-elite-cream" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-calistoga text-2xl sm:text-3xl text-elite-black truncate">
                  {session.user?.name || "Coffee Lover"}
                </h1>
                <div className="flex items-center gap-2 text-elite-black/60 mt-1">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <p className="font-cabin text-sm sm:text-base truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-3 mb-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else if (!item.comingSoon && item.href) {
                        router.push(item.href);
                      }
                    }}
                    disabled={item.comingSoon}
                    className="w-full bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-elite-burgundy/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-elite-burgundy" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="font-cabin font-bold text-elite-black text-base sm:text-lg flex items-center gap-2">
                          {item.label}
                          {item.comingSoon && (
                            <span className="text-xs bg-elite-burgundy/10 text-elite-burgundy px-2 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                        </h3>
                        <p className="font-cabin text-sm text-elite-black/60 truncate">
                          {item.description}
                        </p>
                      </div>
                      {!item.comingSoon && (
                        <ChevronRight
                          className={`w-5 h-5 text-elite-black/30 flex-shrink-0 transition-transform ${
                            item.isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Address Manager - Expanded Section */}
                  {item.label === "Delivery Addresses" && showAddresses && (
                    <div className="mt-3 bg-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-elite-burgundy/10">
                      <AddressManager />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.99] touch-manipulation flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-cabin font-bold text-base sm:text-lg">Sign Out</span>
          </button>
        </div>
      </main>

      <MobileNavigation />
    </>
  );
}
