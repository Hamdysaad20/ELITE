"use client";

import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  LogOut,
  ShoppingBag,
  MapPin,
  Package,
  Award,
  Settings,
  Camera,
  Coffee,
  ChevronRight,
  Bell,
  Globe,
  Trash2,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import SwipeIndicator from "@/components/SwipeIndicator";
import AddressManager from "@/components/AddressManager";
import AvatarUpload from "@/components/AvatarUpload";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useOrders } from "@/hooks/useOrderStatus";
import { useRequireAuth } from "@/lib/auth/hooks";
import Image from "next/image";
import { OrdersAnalytics } from "@/components/orders/OrdersAnalytics";
import { OrdersList } from "@/components/orders/OrdersList";
import { useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { addLocaleToPathname } from "@/i18n/routing";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { authFetch } from "@/lib/auth/apiClient";

type TabType = "orders" | "addresses" | "rewards" | "settings";

function ProfileContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const localizedRouter = useLocalizedRouter();
  const t = useTranslations("profilePage");
  const locale = useLocale();
  const signOutRedirect = addLocaleToPathname("/", locale);
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  // Settings state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders();

  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (
      tabParam &&
      ["orders", "addresses", "rewards", "settings"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [searchParams]);

  // Load notification prefs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("emailNotifications");
      const savedOrder = localStorage.getItem("orderUpdates");
      const savedPromo = localStorage.getItem("promotions");
      if (savedEmail !== null) setEmailNotifications(savedEmail === "true");
      if (savedOrder !== null) setOrderUpdates(savedOrder === "true");
      if (savedPromo !== null) setPromotions(savedPromo === "true");
    }
  }, []);

  // Sync name from session
  useEffect(() => {
    if (session?.user?.name) setNewName(session.user.name);
  }, [session?.user?.name]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName === session?.user?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await authFetch("/api/user/update", {
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

  const handleToggleNotification = async (
    type: "email" | "order" | "promo",
    value: boolean,
  ) => {
    setSavingNotifications(true);
    try {
      if (type === "email") {
        setEmailNotifications(value);
        if (!value) {
          setOrderUpdates(false);
          setPromotions(false);
          localStorage.setItem("emailNotifications", "false");
          localStorage.setItem("orderUpdates", "false");
          localStorage.setItem("promotions", "false");
        } else {
          localStorage.setItem("emailNotifications", "true");
        }
      } else if (type === "order") {
        setOrderUpdates(value);
        localStorage.setItem("orderUpdates", value.toString());
      } else {
        setPromotions(value);
        localStorage.setItem("promotions", value.toString());
      }
      try {
        await authFetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailNotifications: type === "email" ? value : emailNotifications,
            orderUpdates: type === "order" ? value : orderUpdates,
            promotions: type === "promo" ? value : promotions,
          }),
        });
      } catch {
        // Preferences API not yet available — localStorage is the fallback
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
    } finally {
      setSavingNotifications(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  const tabs = [
    { id: "orders" as TabType, label: t("tabs.orders"), icon: ShoppingBag },
    { id: "addresses" as TabType, label: t("tabs.addresses"), icon: MapPin },
    {
      id: "rewards" as TabType,
      label: t("tabs.rewards"),
      icon: Award,
      comingSoon: true,
    },
    { id: "settings" as TabType, label: t("tabs.settings"), icon: Settings },
  ];

  const languageLabel = locale === "ar" ? "العربية" : "English";

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />

      <div className="min-h-screen bg-elite-cream pb-28 md:pb-8">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 md:pt-12 space-y-3 md:space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-3xl shadow-lg border border-elite-burgundy/10 overflow-hidden">
            <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center shadow-lg ring-2 ring-elite-cream/30 overflow-hidden">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || t("avatar.alt")}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-calistoga text-xl sm:text-2xl md:text-3xl text-elite-burgundy">
                        {session.user?.name?.charAt(0).toUpperCase() ||
                          session.user?.email?.charAt(0).toUpperCase() ||
                          t("userInitial")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute inset-0 rounded-full bg-black/0 active:bg-black/40 md:hover:bg-black/40 transition-all flex items-center justify-center opacity-0 active:opacity-100 md:hover:opacity-100 touch-manipulation"
                    title={t("avatar.change")}
                  >
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-calistoga text-lg sm:text-xl md:text-2xl text-elite-cream truncate leading-tight">
                    {session.user?.name ||
                      session.user?.email?.split("@")[0] ||
                      t("user")}
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

            {/* Stats Bar */}
            <div className="bg-elite-cream/40 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-around">
              <div className="text-center">
                <p className="font-calistoga text-lg sm:text-xl text-elite-burgundy">
                  {orders.length}
                </p>
                <p className="font-cabin text-[11px] sm:text-xs text-elite-black/50 uppercase tracking-wide">
                  {t("stats.orders")}
                </p>
              </div>
              <div className="w-px h-8 bg-elite-burgundy/15" />
              <div className="text-center">
                <p className="font-calistoga text-lg sm:text-xl text-elite-burgundy">
                  0
                </p>
                <p className="font-cabin text-[11px] sm:text-xs text-elite-black/50 uppercase tracking-wide">
                  {t("stats.points")}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
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
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] sm:text-xs">{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-elite-burgundy rounded-full" />
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
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <LocalizedLink
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4 text-elite-burgundy" />
                    <span className="font-cabin text-sm font-semibold text-elite-black">
                      {t("orders.viewAll")}
                    </span>
                  </LocalizedLink>
                  <LocalizedLink
                    href="/analytics"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-elite-burgundy text-elite-cream hover:bg-elite-burgundy/90 transition-all whitespace-nowrap"
                  >
                    <Package className="w-4 h-4" />
                    <span className="font-cabin text-sm font-semibold">
                      {t("orders.analytics")}
                    </span>
                  </LocalizedLink>
                </div>
                <OrdersAnalytics orders={orders} />
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
                <h2 className="font-calistoga text-xl sm:text-2xl text-elite-black mb-5">
                  {t("addresses.title")}
                </h2>
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
                  <h2 className="font-calistoga text-2xl text-elite-black mb-3">
                    {t("rewards.title")}
                  </h2>
                  <p className="font-cabin text-elite-black/60 max-w-md mx-auto">
                    {t("rewards.description")}
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Account Information */}
                <div>
                  <h2 className="font-calistoga text-xl text-elite-black mb-3 px-1">
                    {t("settings.accountSection")}
                  </h2>
                  <div className="bg-white rounded-3xl shadow-lg border border-elite-burgundy/10 overflow-hidden divide-y divide-elite-burgundy/8">
                    {/* Profile Picture */}
                    <div className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-elite-burgundy/10 flex items-center justify-center">
                            {session.user?.image ? (
                              <Image
                                src={session.user.image}
                                alt={session.user.name || t("avatar.alt")}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-elite-burgundy" />
                            )}
                          </div>
                          <button
                            onClick={() => setShowAvatarUpload(true)}
                            className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-elite-burgundy text-elite-cream flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                            aria-label={t("avatar.change")}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="font-cabin text-sm text-elite-black/60 mb-0.5">
                            {t("settings.profilePicture")}
                          </p>
                          <button
                            onClick={() => setShowAvatarUpload(true)}
                            className="font-cabin text-sm font-semibold text-elite-burgundy"
                          >
                            {session.user?.image
                              ? t("settings.changePhoto")
                              : t("settings.uploadPhoto")}
                          </button>
                          <p className="font-cabin text-xs text-elite-black/40 mt-0.5">
                            {t("settings.photoHint")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-elite-burgundy/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-5 h-5 text-elite-burgundy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin text-sm text-elite-black/60 mb-1.5">
                            {t("settings.displayName")}
                          </p>
                          {editingName ? (
                            <div className="space-y-2.5">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleSaveName()
                                }
                                className="w-full font-cabin font-semibold text-elite-black bg-elite-cream/50 px-4 py-2.5 rounded-xl border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none transition-colors text-sm"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleSaveName}
                                  disabled={savingName}
                                  className="flex-1 bg-elite-burgundy text-elite-cream px-4 py-2 rounded-xl font-cabin font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                  {savingName
                                    ? t("settings.saving")
                                    : t("settings.saveChanges")}
                                </button>
                                <button
                                  onClick={() => {
                                    setNewName(session?.user?.name || "");
                                    setEditingName(false);
                                  }}
                                  className="px-4 py-2 rounded-xl font-cabin font-semibold text-sm text-elite-black/60 hover:bg-elite-cream/50 transition-colors"
                                >
                                  {t("settings.cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-cabin font-semibold text-elite-black truncate">
                                {session.user?.name ||
                                  session.user?.email?.split("@")[0] ||
                                  t("user")}
                              </p>
                              <button
                                onClick={() => setEditingName(true)}
                                className="text-elite-burgundy font-cabin text-sm font-semibold flex-shrink-0"
                              >
                                {t("settings.edit")}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-elite-burgundy/8 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-elite-burgundy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin text-sm text-elite-black/60 mb-0.5">
                            {t("settings.emailAddress")}
                          </p>
                          <p className="font-cabin font-semibold text-elite-black truncate">
                            {session.user?.email}
                          </p>
                          <p className="font-cabin text-xs text-elite-black/40 mt-0.5">
                            {t("settings.emailHint")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h2 className="font-calistoga text-xl text-elite-black mb-3 px-1">
                    {t("settings.notificationsSection")}
                  </h2>
                  <div className="bg-white rounded-3xl shadow-lg border border-elite-burgundy/10 overflow-hidden divide-y divide-elite-burgundy/8">
                    {/* Master toggle */}
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-elite-burgundy/8 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-elite-burgundy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin font-semibold text-elite-black">
                            {t("settings.emailNotifications")}
                          </p>
                          <p className="font-cabin text-xs text-elite-black/50">
                            {t("settings.emailNotificationsDesc")}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleNotification(
                              "email",
                              !emailNotifications,
                            )
                          }
                          disabled={savingNotifications}
                          role="switch"
                          aria-checked={emailNotifications}
                          className={`relative w-14 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
                            emailNotifications
                              ? "bg-elite-burgundy"
                              : "bg-elite-black/20"
                          } ${savingNotifications ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                              emailNotifications
                                ? "translate-x-7"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Order Updates */}
                    <div
                      className={`p-5 transition-opacity ${!emailNotifications ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin font-semibold text-elite-black text-sm">
                            {t("settings.orderUpdates")}
                          </p>
                          <p className="font-cabin text-xs text-elite-black/50 mt-0.5">
                            {t("settings.orderUpdatesDesc")}
                          </p>
                          {orderUpdates && emailNotifications && (
                            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="font-cabin text-xs font-semibold text-green-700">
                                {t("settings.active")}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleToggleNotification("order", !orderUpdates)
                          }
                          disabled={!emailNotifications || savingNotifications}
                          role="switch"
                          aria-checked={orderUpdates && emailNotifications}
                          className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                            orderUpdates && emailNotifications
                              ? "bg-elite-burgundy"
                              : "bg-elite-black/20"
                          } ${!emailNotifications || savingNotifications ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                              orderUpdates && emailNotifications
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Promotions */}
                    <div
                      className={`p-5 transition-opacity ${!emailNotifications ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin font-semibold text-elite-black text-sm">
                            {t("settings.promotions")}
                          </p>
                          <p className="font-cabin text-xs text-elite-black/50 mt-0.5">
                            {t("settings.promotionsDesc")}
                          </p>
                          {promotions && emailNotifications && (
                            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="font-cabin text-xs font-semibold text-green-700">
                                {t("settings.subscribed")}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleToggleNotification("promo", !promotions)
                          }
                          disabled={!emailNotifications || savingNotifications}
                          role="switch"
                          aria-checked={promotions && emailNotifications}
                          className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                            promotions && emailNotifications
                              ? "bg-elite-burgundy"
                              : "bg-elite-black/20"
                          } ${!emailNotifications || savingNotifications ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                              promotions && emailNotifications
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h2 className="font-calistoga text-xl text-elite-black mb-3 px-1">
                    {t("settings.preferencesSection")}
                  </h2>
                  <div className="bg-white rounded-3xl shadow-lg border border-elite-burgundy/10 overflow-hidden">
                    <div className="p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-elite-burgundy/8 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-elite-burgundy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-cabin font-semibold text-elite-black">
                          {t("settings.language")}
                        </p>
                        <p className="font-cabin text-sm text-elite-black/50">
                          {languageLabel}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-elite-black/25 rtl:rotate-180 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Privacy & Security */}
                <div>
                  <h2 className="font-calistoga text-xl text-elite-black mb-3 px-1">
                    {t("settings.privacySection")}
                  </h2>
                  <div className="bg-white rounded-3xl shadow-lg border border-elite-burgundy/10 overflow-hidden">
                    <button
                      onClick={() => {
                        if (confirm(t("settings.deleteAccountConfirm"))) {
                          localizedRouter.push("/auth/delete-account");
                        }
                      }}
                      className="w-full p-5 hover:bg-red-50 active:bg-red-50 transition-colors text-start"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-cabin font-semibold text-red-600 text-start">
                            {t("settings.deleteAccount")}
                          </p>
                          <p className="font-cabin text-xs text-red-600/60 text-start">
                            {t("settings.deleteAccountDesc")}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-600/30 rtl:rotate-180 flex-shrink-0" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* App Info */}
                <div className="text-center py-4">
                  <p className="font-cabin text-sm text-elite-black/40">
                    {t("settings.appInfo")}
                  </p>
                  <p className="font-cabin text-xs text-elite-black/30 mt-1">
                    {t("settings.appVersion", {
                      year: new Date().getFullYear().toString(),
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* About Elite Coffee */}
          <LocalizedLink
            href="/about"
            className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-elite-burgundy/10 hover:border-elite-burgundy/20 active:scale-[0.98] flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-elite-burgundy/10 flex items-center justify-center flex-shrink-0">
              <Coffee className="w-5 h-5 text-elite-burgundy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-cabin font-semibold text-elite-black text-sm">
                {t("aboutElite")}
              </p>
              <p className="font-cabin text-xs text-elite-black/50">
                {t("aboutEliteDesc")}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-elite-black/30 group-hover:text-elite-burgundy transition-colors flex-shrink-0 rtl:rotate-180" />
          </LocalizedLink>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: signOutRedirect })}
            className="w-full bg-white text-red-600 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-red-100 hover:border-red-200 active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-cabin font-semibold">{t("signOut")}</span>
          </button>
        </div>
      </div>

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
    <Suspense
      fallback={
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
