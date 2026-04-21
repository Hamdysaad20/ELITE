"use client";

import { useTranslations, useFormatter } from "next-intl";
import {
  UtensilsCrossed,
  Tag,
  Gift,
  ChevronRight,
  Package,
  Sparkles,
  MapPin,
  Clock,
  Trophy,
  Star,
} from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useOrders } from "@/hooks/useOrderStatus";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import { useLoyalty } from "@/hooks/useLoyalty";
import { normalizeOrderStatus } from "@/lib/orderStatus";
import { formatOrderRef } from "@/lib/orderUtils";
import Image from "next/image";
import { sanitizeImages } from "@/lib/imageUtils";

interface HomePageProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "rgba(234, 179, 8, 0.12)", text: "#B45309" },
  CONFIRMED: { bg: "rgba(59, 130, 246, 0.12)", text: "#1D4ED8" },
  PREPARING: { bg: "rgba(168, 85, 247, 0.12)", text: "#7C3AED" },
  READY: { bg: "rgba(34, 197, 94, 0.12)", text: "#15803D" },
  OUT_FOR_DELIVERY: { bg: "rgba(59, 130, 246, 0.12)", text: "#1D4ED8" },
  DELIVERED: { bg: "rgba(34, 197, 94, 0.12)", text: "#15803D" },
  CANCELLED: { bg: "rgba(239, 68, 68, 0.12)", text: "#DC2626" },
};

const TIER_COLORS: Record<
  string,
  { gradient: string; text: string; bgAlpha: string }
> = {
  bronze: {
    gradient: "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)",
    text: "#8B4513",
    bgAlpha: "rgba(139, 69, 19, 0.08)",
  },
  silver: {
    gradient: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)",
    text: "#6B6B6B",
    bgAlpha: "rgba(107, 107, 107, 0.08)",
  },
  gold: {
    gradient: "linear-gradient(135deg, #FFD700 0%, #DAA520 100%)",
    text: "#B8860B",
    bgAlpha: "rgba(184, 134, 11, 0.08)",
  },
  platinum: {
    gradient: "linear-gradient(135deg, #8B2635 0%, #A03040 100%)",
    text: "#8B2635",
    bgAlpha: "rgba(139, 38, 53, 0.08)",
  },
};

export function HomePage({ user }: HomePageProps) {
  const t = useTranslations("homePage");
  const tLoyalty = useTranslations("loyalty");
  const format = useFormatter();
  const { orders, loading: ordersLoading } = useOrders({ limit: 3 });
  const {
    products,
    loading: recsLoading,
    isPersonalized,
  } = useRecommendedProducts();
  const { loyalty, loading: loyaltyLoading } = useLoyalty();

  const firstName = user.name?.split(" ")[0] || "";

  return (
    <div
      className="pb-24 md:pb-10"
      style={{ backgroundColor: "var(--elite-cream)" }}
    >
      {/* ── Hero: Greeting + Quick Actions ─────────────────── */}
      <div
        className="px-5 sm:px-8 lg:px-10 pt-8 pb-7 lg:pt-12 lg:pb-10"
        style={{ backgroundColor: "var(--elite-cream)" }}
      >
        <div className="mx-auto max-w-6xl">
          <h1
            className="font-calistoga text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6 lg:mb-7"
            style={{ color: "var(--elite-black)" }}
          >
            {t("greeting", { name: firstName })}
          </h1>

          {/* Quick action pills */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            <LocalizedLink
              href="/menu"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-cabin text-sm font-semibold text-white flex-shrink-0 transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #8B2635 0%, #A03040 100%)",
                boxShadow: "0 2px 10px rgba(139, 38, 53, 0.25)",
              }}
            >
              <UtensilsCrossed className="w-4 h-4" strokeWidth={2} />
              {t("browseMenu")}
            </LocalizedLink>

            <LocalizedLink
              href="/deals"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-cabin text-sm font-semibold flex-shrink-0 transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{
                backgroundColor: "var(--elite-white)",
                color: "var(--elite-black)",
                border: "1.5px solid var(--nav-border)",
              }}
            >
              <Tag className="w-4 h-4" strokeWidth={2} />
              {t("viewDeals")}
            </LocalizedLink>

            <LocalizedLink
              href="/rewards"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-cabin text-sm font-semibold flex-shrink-0 transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{
                backgroundColor: "var(--elite-white)",
                color: "var(--elite-black)",
                border: "1.5px solid var(--nav-border)",
              }}
            >
              <Gift className="w-4 h-4" strokeWidth={2} />
              {t("viewRewards")}
            </LocalizedLink>
          </div>
        </div>
      </div>

      {/* ── Main Content: 2-col on desktop ─────────────────── */}
      <div className="px-5 sm:px-8 lg:px-10 pb-8 lg:pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">
            {/* ── Left column ──────────────────────────────── */}
            <div className="space-y-5 lg:space-y-6">
              {/* Loyalty card */}
              {loyaltyLoading ? (
                <div
                  className="animate-pulse rounded-2xl lg:rounded-3xl"
                  style={{
                    height: "130px",
                    backgroundColor: "var(--elite-white)",
                  }}
                />
              ) : loyalty ? (
                <LoyaltyCard loyalty={loyalty} tLoyalty={tLoyalty} />
              ) : null}

              {/* Recent Orders */}
              <div
                className="rounded-2xl lg:rounded-3xl p-5 lg:p-7"
                style={{
                  backgroundColor: "var(--elite-white)",
                  boxShadow:
                    "0 2px 8px rgba(139, 0, 0, 0.06), 0 4px 16px rgba(139, 0, 0, 0.04)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="font-calistoga text-xl lg:text-2xl"
                    style={{ color: "var(--elite-black)" }}
                  >
                    {t("recentOrders")}
                  </h2>
                  {orders.length > 0 && (
                    <LocalizedLink
                      href="/orders"
                      className="font-cabin text-[13px] font-medium flex items-center gap-0.5 transition-colors flex-shrink-0"
                      style={{ color: "var(--nav-link-active)" }}
                    >
                      {t("seeAllOrders")}
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    </LocalizedLink>
                  )}
                </div>

                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl"
                        style={{
                          height: "80px",
                          backgroundColor: "var(--elite-cream)",
                        }}
                      />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-12 text-center rounded-xl"
                    style={{ backgroundColor: "var(--elite-cream)" }}
                  >
                    <Package
                      className="w-10 h-10 mb-3"
                      style={{
                        color: "var(--nav-link-default)",
                        opacity: 0.45,
                      }}
                      strokeWidth={1.4}
                    />
                    <p
                      className="font-cabin text-sm font-semibold mb-1"
                      style={{ color: "var(--elite-black)" }}
                    >
                      {t("noOrders")}
                    </p>
                    <p
                      className="font-cabin text-xs mb-5"
                      style={{ color: "var(--nav-link-default)" }}
                    >
                      {t("noOrdersDesc")}
                    </p>
                    <LocalizedLink
                      href="/menu"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-cabin text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                      style={{
                        background:
                          "linear-gradient(135deg, #8B2635 0%, #A03040 100%)",
                      }}
                    >
                      <UtensilsCrossed className="w-4 h-4" strokeWidth={2} />
                      {t("browseMenu")}
                    </LocalizedLink>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => {
                      const status = normalizeOrderStatus(order.status);
                      const colors =
                        STATUS_COLORS[status] || STATUS_COLORS.PENDING;
                      const firstItem = order.items?.[0];
                      const firstItemName =
                        firstItem?.menuItem?.name ||
                        firstItem?.menuItem?.description;
                      const extraCount = (order.items?.length || 1) - 1;
                      const orderDate = new Date(order.createdAt);
                      const displayRef = formatOrderRef(
                        order.clientOrderRef,
                        order.id,
                      );

                      return (
                        <LocalizedLink
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
                          style={{
                            backgroundColor: "var(--elite-cream)",
                            border: "1px solid var(--nav-border)",
                          }}
                        >
                          <div
                            className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                            style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "12px",
                              backgroundColor: "var(--elite-white)",
                            }}
                          >
                            {firstItem?.menuItem?.images?.[0] ? (
                              <Image
                                src={
                                  sanitizeImages(
                                    firstItem.menuItem.images,
                                  )[0] || ""
                                }
                                alt=""
                                width={52}
                                height={52}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package
                                className="w-5 h-5"
                                style={{ color: "var(--nav-link-default)" }}
                                strokeWidth={1.6}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span
                              className="font-cabin text-sm font-semibold truncate block mb-1.5"
                              style={{ color: "var(--elite-black)" }}
                            >
                              {firstItemName || `#${displayRef}`}
                              {extraCount > 0 && firstItemName && (
                                <span
                                  className="font-normal"
                                  style={{ color: "var(--nav-link-default)" }}
                                >
                                  {" "}
                                  {t("andMore", { count: extraCount })}
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className="font-cabin text-[10px] font-semibold px-2 py-0.5 flex-shrink-0"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  borderRadius: "9999px",
                                }}
                              >
                                {t(`orderStatus.${status}`)}
                              </span>
                              <span
                                className="font-cabin text-xs truncate"
                                style={{ color: "var(--nav-link-default)" }}
                              >
                                #{displayRef} &middot;{" "}
                                {format.dateTime(orderDate, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            className="w-4 h-4 flex-shrink-0 rtl:rotate-180"
                            style={{ color: "var(--nav-link-default)" }}
                          />
                        </LocalizedLink>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right column (sidebar on desktop) ────────── */}
            <div className="space-y-5 lg:space-y-6 mt-5 lg:mt-0">
              {/* Recommended For You */}
              <div
                className="rounded-2xl lg:rounded-3xl p-5 lg:p-7"
                style={{
                  backgroundColor: "var(--elite-white)",
                  boxShadow:
                    "0 2px 8px rgba(139, 0, 0, 0.06), 0 4px 16px rgba(139, 0, 0, 0.04)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2
                      className="font-calistoga text-xl lg:text-2xl"
                      style={{ color: "var(--elite-black)" }}
                    >
                      {t("recommendedForYou")}
                    </h2>
                    {isPersonalized && (
                      <span
                        className="hidden sm:inline-flex items-center gap-1 font-cabin text-[10px] font-semibold px-2 py-0.5 flex-shrink-0"
                        style={{
                          backgroundColor: "var(--nav-ar-bg)",
                          color: "var(--nav-ar-color)",
                          borderRadius: "9999px",
                          border: "1px solid var(--nav-ar-border)",
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        {t("personalizedLabel")}
                      </span>
                    )}
                  </div>
                  <LocalizedLink
                    href="/menu"
                    className="font-cabin text-[13px] font-medium flex items-center gap-0.5 transition-colors flex-shrink-0 ms-3"
                    style={{ color: "var(--nav-link-active)" }}
                  >
                    {t("viewAll")}
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </LocalizedLink>
                </div>

                {recsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl"
                        style={{
                          height: "160px",
                          backgroundColor: "var(--elite-cream)",
                        }}
                      />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 6).map((product) => (
                      <LocalizedLink
                        key={product.id}
                        href={`/menu?product=${product.name}`}
                        className="group flex flex-col overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                        style={{
                          backgroundColor: "var(--elite-cream)",
                          border: "1px solid var(--nav-border)",
                        }}
                      >
                        <div
                          className="relative w-full overflow-hidden rounded-t-xl"
                          style={{ height: "100px" }}
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 45vw, 180px"
                            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-3">
                          <p
                            className="font-cabin text-[13px] font-semibold leading-tight truncate"
                            style={{ color: "var(--elite-black)" }}
                          >
                            {product.name}
                          </p>
                          <p
                            className="font-cabin text-[11px] mt-0.5 truncate"
                            style={{ color: "var(--nav-link-default)" }}
                          >
                            {product.category}
                          </p>
                        </div>
                      </LocalizedLink>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Visit Us */}
              <LocalizedLink
                href="/#location"
                className="flex items-center gap-4 p-5 lg:p-6 rounded-2xl lg:rounded-3xl transition-all duration-200 hover:shadow-md active:scale-[0.99]"
                style={{
                  backgroundColor: "var(--elite-white)",
                  border: "1px solid var(--nav-border)",
                  boxShadow:
                    "0 2px 8px rgba(139, 0, 0, 0.06), 0 4px 16px rgba(139, 0, 0, 0.04)",
                }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background:
                      "linear-gradient(135deg, #8B2635 0%, #A03040 100%)",
                    flexShrink: 0,
                  }}
                >
                  <MapPin className="w-5 h-5 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-calistoga text-base lg:text-lg"
                    style={{ color: "var(--elite-black)" }}
                  >
                    {t("visitUsTitle")}
                  </p>
                  <p
                    className="font-cabin text-xs mt-1 flex items-center gap-1.5"
                    style={{ color: "var(--nav-link-default)" }}
                  >
                    <Clock
                      className="w-3.5 h-3.5 flex-shrink-0"
                      strokeWidth={1.8}
                    />
                    {t("visitUsHours")}
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 rtl:rotate-180"
                  style={{ color: "var(--nav-link-default)" }}
                />
              </LocalizedLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoyaltyCardProps {
  loyalty: NonNullable<ReturnType<typeof useLoyalty>["loyalty"]>;
  tLoyalty: ReturnType<typeof useTranslations>;
}

function LoyaltyCard({ loyalty, tLoyalty }: LoyaltyCardProps) {
  const level = loyalty.account.level.toLowerCase();
  const tierColors = TIER_COLORS[level] || TIER_COLORS.bronze;
  const progress = loyalty.tiers.progress;
  const nextTier = loyalty.tiers.next;

  return (
    <LocalizedLink
      href="/rewards"
      className="block rounded-2xl lg:rounded-3xl p-5 lg:p-7 transition-all duration-200 hover:shadow-md active:scale-[0.99]"
      style={{
        backgroundColor: "var(--elite-white)",
        border: "1px solid var(--nav-border)",
        boxShadow:
          "0 2px 8px rgba(139, 0, 0, 0.06), 0 4px 16px rgba(139, 0, 0, 0.04)",
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: tierColors.gradient,
          }}
        >
          {level === "platinum" ? (
            <Star className="w-5 h-5 text-white" strokeWidth={1.8} />
          ) : (
            <Trophy className="w-5 h-5 text-white" strokeWidth={1.8} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-cabin text-sm font-semibold"
              style={{ color: "var(--elite-black)" }}
            >
              {tLoyalty("card.memberLabel", {
                level: tLoyalty(`levels.${level}`),
              })}
            </span>
            <span
              className="font-cabin text-[10px] font-semibold px-2.5 py-1"
              style={{
                backgroundColor: tierColors.bgAlpha,
                color: tierColors.text,
                borderRadius: "9999px",
              }}
            >
              {loyalty.account.points} {tLoyalty("card.pointsLabel")}
            </span>
          </div>
          {nextTier ? (
            <p
              className="font-cabin text-xs mt-1"
              style={{ color: "var(--nav-link-default)" }}
            >
              {tLoyalty("card.pointsToNext", {
                count: nextTier.minPoints - loyalty.account.points,
                level: tLoyalty(`levels.${nextTier.level.toLowerCase()}`),
              })}
            </p>
          ) : (
            <p
              className="font-cabin text-xs mt-1"
              style={{ color: "var(--nav-link-default)" }}
            >
              {tLoyalty("card.maxTier.title")}
            </p>
          )}
        </div>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 rtl:rotate-180"
          style={{ color: "var(--nav-link-default)" }}
        />
      </div>

      {nextTier && (
        <div>
          <div
            className="w-full overflow-hidden"
            style={{
              height: "6px",
              borderRadius: "9999px",
              backgroundColor: "var(--elite-cream)",
            }}
          >
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${Math.min(progress, 100)}%`,
                borderRadius: "9999px",
                background: tierColors.gradient,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span
              className="font-cabin text-[11px]"
              style={{ color: "var(--nav-link-default)" }}
            >
              {tLoyalty(`levels.${level}`)}
            </span>
            <span
              className="font-cabin text-[11px]"
              style={{ color: "var(--nav-link-default)" }}
            >
              {tLoyalty(`levels.${nextTier.level.toLowerCase()}`)}
            </span>
          </div>
        </div>
      )}
    </LocalizedLink>
  );
}
