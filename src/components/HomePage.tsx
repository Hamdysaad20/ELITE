"use client";

import { useTranslations, useFormatter } from "next-intl";
import {
  UtensilsCrossed,
  Tag,
  ChevronRight,
  Package,
  Sparkles,
} from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useOrders } from "@/hooks/useOrderStatus";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import { normalizeOrderStatus } from "@/lib/orderStatus";
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

export default function HomePage({ user }: HomePageProps) {
  const t = useTranslations("homePage");
  const format = useFormatter();
  const { orders, loading: ordersLoading } = useOrders({ limit: 3 });
  const {
    products,
    loading: recsLoading,
    isPersonalized,
  } = useRecommendedProducts();

  const firstName = user.name?.split(" ")[0] || "";

  return (
    <main className="pb-24 md:pb-8">
      {/* ── Greeting + Quick Actions ──────────────────── */}
      <section
        className="px-4 sm:px-6 pt-6 pb-8"
        style={{ backgroundColor: "var(--elite-cream)" }}
      >
        <div className="mx-auto max-w-3xl">
          <h1
            className="font-calistoga text-2xl sm:text-3xl mb-6"
            style={{ color: "var(--elite-black)" }}
          >
            {t("greeting", { name: firstName })}
          </h1>

          <div className="grid grid-cols-2 gap-3">
            {/* Browse Menu — primary */}
            <LocalizedLink
              href="/menu"
              className="flex items-center gap-3 p-4 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #8B2635 0%, #A03040 100%)",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(139, 38, 53, 0.2)",
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                }}
              >
                <UtensilsCrossed
                  className="w-5 h-5 text-white"
                  strokeWidth={1.8}
                />
              </div>
              <span className="font-cabin text-sm sm:text-base font-semibold text-white">
                {t("browseMenu")}
              </span>
            </LocalizedLink>

            {/* View Deals — secondary */}
            <LocalizedLink
              href="/deals"
              className="flex items-center gap-3 p-4 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: "var(--elite-white)",
                borderRadius: "20px",
                border: "1.5px solid var(--nav-border)",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(196, 104, 60, 0.1)",
                }}
              >
                <Tag
                  className="w-5 h-5"
                  style={{ color: "var(--nav-deals-color)" }}
                  strokeWidth={1.8}
                />
              </div>
              <span
                className="font-cabin text-sm sm:text-base font-semibold"
                style={{ color: "var(--elite-black)" }}
              >
                {t("viewDeals")}
              </span>
            </LocalizedLink>
          </div>
        </div>
      </section>

      {/* ── Recent Orders ─────────────────────────────── */}
      <section className="px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-calistoga text-lg sm:text-xl"
              style={{ color: "var(--elite-black)" }}
            >
              {t("recentOrders")}
            </h2>
            {orders.length > 0 && (
              <LocalizedLink
                href="/orders"
                className="font-cabin text-[13px] font-medium flex items-center gap-0.5 transition-colors"
                style={{ color: "var(--nav-link-active)" }}
              >
                {t("seeAllOrders")}
                <ChevronRight className="w-4 h-4" />
              </LocalizedLink>
            )}
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    height: "80px",
                    backgroundColor: "var(--elite-cream)",
                    borderRadius: "16px",
                  }}
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-center"
              style={{
                backgroundColor: "var(--elite-cream)",
                borderRadius: "20px",
              }}
            >
              <Package
                className="w-10 h-10 mb-3"
                style={{ color: "var(--nav-link-default)", opacity: 0.5 }}
                strokeWidth={1.4}
              />
              <p
                className="font-cabin text-sm font-medium mb-1"
                style={{ color: "var(--elite-black)" }}
              >
                {t("noOrders")}
              </p>
              <p
                className="font-cabin text-xs"
                style={{ color: "var(--nav-link-default)" }}
              >
                {t("noOrdersDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => {
                const status = normalizeOrderStatus(order.status);
                const colors = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
                const itemCount = order.items?.length || 0;
                const orderDate = new Date(order.createdAt);

                return (
                  <LocalizedLink
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-3 p-4 transition-all duration-200 hover:shadow-md active:scale-[0.99]"
                    style={{
                      backgroundColor: "var(--elite-white)",
                      borderRadius: "16px",
                      border: "1px solid var(--nav-border)",
                    }}
                  >
                    {/* Order items preview */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "var(--elite-cream)",
                      }}
                    >
                      {order.items?.[0]?.menuItem?.images?.[0] ? (
                        <Image
                          src={
                            sanitizeImages(order.items[0].menuItem.images)[0] ||
                            ""
                          }
                          alt=""
                          width={48}
                          height={48}
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

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="font-cabin text-sm font-semibold truncate"
                          style={{ color: "var(--elite-black)" }}
                        >
                          #{order.orderNumber}
                        </span>
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
                      </div>
                      <p
                        className="font-cabin text-xs truncate"
                        style={{ color: "var(--nav-link-default)" }}
                      >
                        {t("items", { count: itemCount })} &middot;{" "}
                        {format.dateTime(orderDate, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <ChevronRight
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--nav-link-default)" }}
                    />
                  </LocalizedLink>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Recommended For You ───────────────────────── */}
      <section
        className="px-4 sm:px-6 py-6"
        style={{ backgroundColor: "var(--elite-cream)" }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2
                className="font-calistoga text-lg sm:text-xl"
                style={{ color: "var(--elite-black)" }}
              >
                {t("recommendedForYou")}
              </h2>
              {isPersonalized && (
                <span
                  className="inline-flex items-center gap-1 font-cabin text-[10px] font-semibold px-2 py-0.5"
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
              className="font-cabin text-[13px] font-medium flex items-center gap-0.5 transition-colors"
              style={{ color: "var(--nav-link-active)" }}
            >
              {t("viewAll")}
              <ChevronRight className="w-4 h-4" />
            </LocalizedLink>
          </div>

          {recsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    height: "180px",
                    backgroundColor: "var(--elite-white)",
                    borderRadius: "20px",
                  }}
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {products.slice(0, 4).map((product) => (
                <LocalizedLink
                  key={product.id}
                  href={`/menu?product=${product.name}`}
                  className="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--elite-white)",
                    borderRadius: "20px",
                    border: "1px solid var(--nav-border)",
                  }}
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      height: "120px",
                      backgroundColor: "var(--elite-light-cream)",
                      borderRadius: "20px 20px 0 0",
                    }}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p
                      className="font-cabin text-sm font-semibold leading-tight truncate"
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
      </section>
    </main>
  );
}
