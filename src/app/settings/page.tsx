"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, Bell, Globe, Trash2, ChevronRight, MapPin as MapPinIcon, CreditCard, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useRequireAuth } from "@/lib/auth/hooks";
import AvatarUpload from "@/components/AvatarUpload";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data: session, update } = useSession();
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  useEffect(() => {
    if (session?.user?.name) {
      setNewName(session.user.name);
    }
  }, [session?.user?.name]);

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

  const handleSaveName = async () => {
    if (!newName.trim() || newName === session.user?.name) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        await update({ name: newName.trim() });
        setEditingName(false);
      }
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setSavingName(false);
    }
  };

  const handleToggleNotification = async (type: "email" | "order" | "promo", value: boolean) => {
    setSavingNotifications(true);
    
    try {
      // Update local state immediately for better UX
      if (type === "email") {
        setEmailNotifications(value);
        if (!value) {
          setOrderUpdates(false);
          setPromotions(false);
        }
      } else if (type === "order") {
        setOrderUpdates(value);
      } else if (type === "promo") {
        setPromotions(value);
      }

      // TODO: Add API call to save notification preferences
      // await fetch("/api/user/preferences", { ... });
      
    } catch (error) {
      console.error("Error updating notifications:", error);
    } finally {
      setSavingNotifications(false);
    }
  };

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block">
      </div>
      <MobileHeader title="Settings" showBack={true} />
      
      <main className="min-h-screen bg-elite-cream pb-20 md:pb-8 pt-16 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-12">
          
          {/* Account Settings */}
          <div className="mb-6">
            <h2 className="font-calistoga text-2xl text-elite-black mb-4 px-1">Account Information</h2>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
              {/* Profile Picture */}
              <div className="p-6 border-b border-elite-burgundy/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-elite-burgundy/10 flex items-center justify-center">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "Profile"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-elite-burgundy" />
                      )}
                    </div>
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-elite-burgundy text-elite-cream flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      aria-label={session.user?.image ? "Change profile photo" : "Upload profile photo"}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="font-cabin text-sm text-elite-black/60 mb-1">Profile Picture</p>
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="font-cabin text-sm font-semibold text-elite-burgundy hover:underline"
                    >
                      {session.user?.image ? "Change Photo" : "Upload Photo"}
                    </button>
                    <p className="font-cabin text-xs text-elite-black/40 mt-1">JPG, PNG or WebP • Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* 
              {/* Name */}
              <div className="p-6 border-b border-elite-burgundy/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-elite-burgundy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabin text-sm text-elite-black/60 mb-2">Display Name</p>
                    {editingName ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full font-cabin font-semibold text-elite-black bg-elite-cream/50 px-4 py-3 rounded-xl border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none transition-colors"
                          placeholder="Enter your name"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="flex-1 bg-elite-burgundy text-elite-cream px-4 py-2.5 rounded-xl font-cabin font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {savingName ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            onClick={() => {
                              setNewName(session.user?.name || "");
                              setEditingName(false);
                            }}
                            className="px-4 py-2.5 rounded-xl font-cabin font-semibold text-elite-black/60 hover:bg-elite-cream/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-cabin font-semibold text-elite-black text-lg">
                          {session.user?.name || session.user?.email?.split('@')[0] || "User"}
                        </p>
                        <button
                          onClick={() => setEditingName(true)}
                          className="text-elite-burgundy font-cabin text-sm font-semibold hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="p-6 border-b border-elite-burgundy/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-elite-burgundy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabin text-sm text-elite-black/60 mb-1">Email Address</p>
                    <p className="font-cabin font-semibold text-elite-black text-lg truncate">
                      {session.user?.email}
                    </p>
                    <p className="font-cabin text-xs text-elite-black/40 mt-1">Used for sign-in and notifications</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 bg-elite-cream/30">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push("/profile?tab=addresses")}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all border border-elite-burgundy/10"
                  >
                    <MapPinIcon className="w-5 h-5 text-elite-burgundy" />
                    <span className="font-cabin font-semibold text-sm text-elite-black">Addresses</span>
                  </button>
                  <button
                    onClick={() => router.push("/profile?tab=orders")}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all border border-elite-burgundy/10"
                  >
                    <CreditCard className="w-5 h-5 text-elite-burgundy" />
                    <span className="font-cabin font-semibold text-sm text-elite-black">Orders</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-6">
            <h2 className="font-calistoga text-2xl text-elite-black mb-4 px-1">Notifications</h2>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
              
              {/* Email Notifications Master Toggle */}
              <div className="p-6 border-b border-elite-burgundy/10 bg-elite-cream/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-elite-burgundy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabin font-bold text-elite-black text-lg">Email Notifications</p>
                    <p className="font-cabin text-sm text-elite-black/60">Master control for all email updates</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification("email", !emailNotifications)}
                    disabled={savingNotifications}
                    className={`relative w-16 h-9 rounded-full transition-all duration-200 ${
                      emailNotifications ? "bg-elite-burgundy shadow-md shadow-elite-burgundy/30" : "bg-elite-black/20"
                    } ${savingNotifications ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"}`}
                  >
                    <div
                      className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        emailNotifications ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Order Updates */}
              <div className={`p-6 border-b border-elite-burgundy/10 transition-opacity duration-200 ${
                !emailNotifications ? "opacity-60" : "opacity-100"
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className={`font-cabin font-semibold text-lg transition-colors ${
                          !emailNotifications ? "text-elite-black/40" : "text-elite-black"
                        }`}>Order Updates</p>
                        {!emailNotifications && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-elite-black/5 rounded-full">
                            <span className="font-cabin text-xs text-elite-black/40">Disabled</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleNotification("order", !orderUpdates)}
                        disabled={!emailNotifications || savingNotifications}
                        className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                          orderUpdates && emailNotifications ? "bg-elite-burgundy shadow-md shadow-elite-burgundy/30" : "bg-elite-black/20"
                        } ${
                          !emailNotifications || savingNotifications 
                            ? "opacity-40 cursor-not-allowed" 
                            : "cursor-pointer hover:shadow-lg"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                            orderUpdates && emailNotifications ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className={`font-cabin text-sm mb-2 transition-colors ${
                      !emailNotifications ? "text-elite-black/40" : "text-elite-black/60"
                    }`}>
                      Receive updates about your order status and delivery
                    </p>
                    {orderUpdates && emailNotifications && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-cabin text-xs font-semibold text-green-700">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Promotions & Offers */}
              <div className={`p-6 transition-opacity duration-200 ${
                !emailNotifications ? "opacity-60" : "opacity-100"
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className={`font-cabin font-semibold text-lg transition-colors ${
                          !emailNotifications ? "text-elite-black/40" : "text-elite-black"
                        }`}>Promotions & Offers</p>
                        {!emailNotifications && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-elite-black/5 rounded-full">
                            <span className="font-cabin text-xs text-elite-black/40">Disabled</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleNotification("promo", !promotions)}
                        disabled={!emailNotifications || savingNotifications}
                        className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                          promotions && emailNotifications ? "bg-elite-burgundy shadow-md shadow-elite-burgundy/30" : "bg-elite-black/20"
                        } ${
                          !emailNotifications || savingNotifications 
                            ? "opacity-40 cursor-not-allowed" 
                            : "cursor-pointer hover:shadow-lg"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                            promotions && emailNotifications ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className={`font-cabin text-sm mb-2 transition-colors ${
                      !emailNotifications ? "text-elite-black/40" : "text-elite-black/60"
                    }`}>
                      Get special deals, discounts, and new menu announcements
                    </p>
                    {promotions && emailNotifications && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-cabin text-xs font-semibold text-green-700">Subscribed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-6">
            <h2 className="font-calistoga text-2xl text-elite-black mb-4 px-1">Preferences</h2>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
              
              {/* Language */}
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-elite-burgundy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabin font-semibold text-elite-black text-lg">Language</p>
                    <p className="font-cabin text-sm text-elite-black/60">English (US)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
  {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <AvatarUpload
          onClose={() => setShowAvatarUpload(false)}
          currentImage={session.user?.image}
        />
      )}
    
          {/* Privacy & Security */}
          <div className="mb-6">
            <h2 className="font-calistoga text-2xl text-elite-black mb-4 px-1">Privacy & Security</h2>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 overflow-hidden">
              
              {/* Delete Account */}
              <button
                onClick={() => {
                  if (confirm("⚠️ Are you sure you want to delete your account?\n\nThis will permanently remove:\n• Your profile and order history\n• Saved addresses\n• All preferences\n\nThis action cannot be undone.")) {
                    router.push("/auth/delete-account");
                  }
                }}
                className="w-full p-6 hover:bg-red-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-cabin font-semibold text-red-600 text-lg">Delete Account</p>
                    <p className="font-cabin text-sm text-red-600/70">Permanently remove your account and data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-600/30" />
                </div>
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="text-center py-8">
            <p className="font-cabin text-sm text-elite-black/40">ELITE Coffee App</p>
            <p className="font-cabin text-xs text-elite-black/30 mt-1">Version 1.0.0 • © 2025 ELITE Coffee</p>
          </div>
        </div>
      </main>

    </>
  );
}
