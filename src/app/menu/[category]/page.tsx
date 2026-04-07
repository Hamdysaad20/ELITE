"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";
import { useProducts, Product } from "@/hooks/useProducts";
import { sanitizeImages } from "@/lib/imageUtils";
import {
  getAllCategories,
  MenuCategory as FallbackMenuCategory,
  MenuItem as FallbackMenuItem,
} from "@/lib/menuData";
import { Coffee, Sparkles, Heart, Utensils, Home } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import DrinkCard from "@/components/DrinkCard";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CategoryPageSkeleton from "@/components/skeletons/CategoryPageSkeleton";
import ProductModal from "@/components/menu/ProductModal";
import LocalizedLink from "@/components/LocalizedLink";
import { useTranslations } from "next-intl";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";

type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  comingSoon?: boolean;
  subCategories: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      images: string[];
      available?: boolean;
    }>;
  }>;
};

export default function CategoryPage() {
  const params = useParams();
  const localizedRouter = useLocalizedRouter();
  const categoryId = params?.category as string;
  const t = useTranslations("categoryPage");
  const prefersReduced = useReducedMotion();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  const {
    categories: apiCategories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
    isEmpty: categoriesEmpty,
  } = useCategories();

  const {
    products: apiProducts,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    lastUpdate: productsLastUpdate,
  } = useProducts();

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;
  const USE_FALLBACK =
    error?.includes("503") || error?.includes("cache is empty");

  const handleRetry = () => {
    refetchCategories();
    refetchProducts();
  };

  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-5 h-5" };
    switch (iconName) {
      case "coffee":
        return <Coffee {...iconProps} />;
      case "sparkles":
        return <Sparkles {...iconProps} />;
      case "heart":
        return <Heart {...iconProps} />;
      case "utensils":
        return <Utensils {...iconProps} />;
      case "home":
        return <Home {...iconProps} />;
      default:
        return <Coffee {...iconProps} />;
    }
  };

  const categories: MenuCategory[] = useMemo(() => {
    if (USE_FALLBACK) {
      const fallbackCategories: FallbackMenuCategory[] = getAllCategories();

      return fallbackCategories
        .filter((cat) => {
          const categoryName = (cat.name || "").toLowerCase();
          return !categoryName.includes("offer");
        })
        .reduce<MenuCategory[]>((acc, cat) => {
          const items: FallbackMenuItem[] = cat.subCategories.flatMap(
            (s) => s.items,
          );
          if (!cat.id || items.length === 0) return acc;

          acc.push({
            id: String(cat.id),
            name: cat.name || t("fallback.unknownCategory"),
            description: cat.description || t("fallback.categoryDescription"),
            icon: cat.icon || "coffee",
            comingSoon: false,
            subCategories: [
              {
                id: String(cat.id),
                name: cat.name || t("fallback.unknownCategory"),
                items: items.map((p) => ({
                  id: String(p.id),
                  name: p.name || t("fallback.unknownProduct"),
                  description: p.description || "",
                  price: typeof p.price === "number" ? p.price : 0,
                  images:
                    p.images.length > 0
                      ? p.images
                      : ["/images/PRINTING_CUP.png"],
                  available: p.available !== false,
                })),
              },
            ],
          });

          return acc;
        }, []);
    }

    if (
      !apiCategories ||
      !Array.isArray(apiCategories) ||
      apiCategories.length === 0
    ) {
      return [];
    }

    return apiCategories
      .filter((cat) => {
        const categoryName = cat?.name?.toLowerCase() || "";
        return !categoryName.includes("offer");
      })
      .reduce<MenuCategory[]>((acc, cat) => {
        if (!cat?.id) return acc;

        const categoryProducts = (apiProducts || []).filter(
          (p) => p?.categoryId === cat.id,
        );
        if (categoryProducts.length === 0) return acc;

        const items = categoryProducts.flatMap((p) => {
          if (!p?.id) return [];
          return [
            {
              id: p.id,
              name: p.name || t("fallback.unknownProduct"),
              description: p.description || "",
              price: typeof p.price === "number" ? p.price : 0,
              images: sanitizeImages(p.images),
              available: p.available !== false,
            },
          ];
        });

        if (items.length === 0) return acc;

        acc.push({
          id: cat.id,
          name: cat.name || t("fallback.unknownCategory"),
          description: cat.description || t("fallback.categoryDescription"),
          icon: "coffee",
          comingSoon: false,
          subCategories: [
            {
              id: cat.id,
              name: cat.name || t("fallback.unknownCategory"),
              items,
            },
          ],
        });

        return acc;
      }, []);
  }, [USE_FALLBACK, apiCategories, apiProducts, t]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === String(categoryId)) || null;
  }, [categories, categoryId]);

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />

      {/* Mobile-only back-button header — replaces global nav on overlay pages */}
      <MobileHeader
        title={selectedCategory?.name}
        showBack={true}
        transparent={true}
      />

      {/* Slide-in animation wrapper */}
      <motion.div
        initial={prefersReduced ? false : { x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1.0] }}
      >
        {/* ── Full page background ── */}
        <div className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-elite-cream via-[#f8f0e4] to-[#f3e6d8] pb-8 md:pb-0">
          {/* Subtle mobile atmospheric blobs */}
          <div className="pointer-events-none absolute inset-0 md:hidden">
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-elite-burgundy/[0.10] to-transparent" />
            <div className="absolute -top-8 start-0 h-40 w-40 rounded-full bg-white/45 blur-3xl" />
            <div className="absolute top-24 end-0 h-44 w-44 rounded-full bg-elite-burgundy/[0.10] blur-3xl" />
          </div>

          {/* ── Content ── */}
          <div className="relative z-20">
            <div className="relative bg-transparent">
              {/* Mobile: push content below MobileHeader (~66px + safe area) */}
              {/* Desktop: push content below DesktopHeader (64px) */}
              <div
                className="mx-auto max-w-[1520px] px-0 md:px-6 lg:px-8 xl:px-10 2xl:px-12"
                style={{
                  paddingTop: "calc(max(env(safe-area-inset-top), 8px) + 62px)",
                }}
              >
                {/* ── Mobile: floating card ── */}
                <div className="mx-3 rounded-[1.75rem] border border-elite-burgundy/12 bg-elite-cream/95 shadow-[0_18px_44px_rgba(139,38,53,0.14)] backdrop-blur-sm md:mx-0 md:rounded-none md:border-0 md:bg-transparent md:shadow-none">
                  {loading && <CategoryPageSkeleton />}

                  {error && !loading && (
                    <ErrorState
                      error={error}
                      onRetry={handleRetry}
                      size="large"
                    />
                  )}

                  {!loading &&
                    !error &&
                    (categoriesEmpty || categories.length === 0) && (
                      <EmptyState
                        variant="no-products"
                        title={t("catalogNotSynced.title")}
                        description={t("catalogNotSynced.description")}
                        actionLabel={t("actions.refresh")}
                        onAction={handleRetry}
                      />
                    )}

                  {!loading && !error && categories.length > 0 && (
                    <>
                      {/* ── Mobile: horizontal category pills ── */}
                      <div
                        className="lg:hidden sticky z-30 -mx-4 border-b border-elite-burgundy/8 bg-elite-cream/90 px-4 backdrop-blur-md"
                        style={{
                          top: "calc(max(env(safe-area-inset-top), 8px) + 62px)",
                        }}
                      >
                        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
                          <div className="flex gap-2 py-2.5 min-w-max snap-x snap-mandatory">
                            {categories.map((cat) => {
                              const isActive =
                                String(cat.id) === String(categoryId);
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() =>
                                    localizedRouter.push(`/menu/${cat.id}`)
                                  }
                                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap touch-manipulation active:scale-95 snap-start ${
                                    isActive
                                      ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20"
                                      : "bg-elite-cream text-elite-black/70 border border-elite-burgundy/12 active:bg-elite-burgundy/5"
                                  }`}
                                >
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                      isActive
                                        ? "bg-elite-cream"
                                        : "bg-elite-burgundy/60"
                                    }`}
                                  />
                                  <span
                                    className={`font-cabin text-sm ${isActive ? "font-bold" : "font-medium"}`}
                                  >
                                    {cat.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* ── Two-panel layout (sidebar + main) ── */}
                      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 min-w-0">
                        {/* Desktop sidebar */}
                        <div className="hidden lg:block lg:w-[230px] xl:w-[250px] flex-shrink-0">
                          <div className="rounded-2xl border border-elite-burgundy/8 bg-elite-cream/65 shadow-[0_8px_30px_rgba(139,38,53,0.06)] backdrop-blur-sm overflow-hidden sticky top-24 max-h-[calc(100vh-7rem)]">
                            <div className="px-5 pt-5 pb-3">
                              <h2 className="font-calistoga text-lg text-elite-black tracking-[-0.01em]">
                                {t("sidebar.title")}
                              </h2>
                              <p className="font-cabin text-xs text-elite-black/45 mt-0.5">
                                {t("sidebar.subtitle")}
                              </p>
                            </div>

                            <nav className="flex flex-col gap-0.5 px-3 pb-3 max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-hide">
                              {categories.map((cat) => {
                                const isActive =
                                  String(cat.id) === String(categoryId);
                                return (
                                  <LocalizedLink
                                    key={cat.id}
                                    href={`/menu/${cat.id}`}
                                    className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 font-cabin text-sm transition-all duration-200 ${
                                      isActive
                                        ? "bg-elite-burgundy text-elite-cream font-semibold shadow-md shadow-elite-burgundy/20"
                                        : "text-elite-black/70 hover:bg-elite-cream/80 font-medium"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                        isActive
                                          ? "bg-elite-cream"
                                          : "bg-elite-burgundy/40"
                                      }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="block truncate">
                                        {cat.name}
                                      </span>
                                      {!isActive && (
                                        <span className="text-[11px] text-elite-black/40">
                                          {t("itemsAvailable", {
                                            count:
                                              cat.subCategories[0]?.items
                                                .length || 0,
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </LocalizedLink>
                                );
                              })}
                            </nav>

                            <div className="px-5 py-3 border-t border-elite-burgundy/8">
                              <p className="font-cabin text-[11px] text-elite-black/35">
                                {t("sidebar.footer")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ── Main content ── */}
                        <div className="flex-1 min-w-0 rounded-none md:rounded-[1.75rem] overflow-hidden shadow-none md:shadow-[0_4px_24px_rgba(139,38,53,0.05)]">
                          {!selectedCategory && (
                            <div className="bg-white p-5 xl:p-7">
                              <EmptyState
                                variant="no-products"
                                title={t("categoryNotFound.title")}
                                description={t("categoryNotFound.description")}
                                actionLabel={t("actions.backToMenu")}
                                onAction={() => localizedRouter.push("/menu")}
                              />
                            </div>
                          )}

                          {selectedCategory && (
                            <section className="relative bg-white pt-3 lg:pt-5 pb-6 xl:pb-8">
                              {/* Desktop category banner */}
                              <div className="relative hidden lg:block mx-5 xl:mx-7 mb-5 rounded-2xl bg-gradient-to-r from-elite-burgundy/[0.05] via-elite-burgundy/[0.02] to-transparent border border-elite-burgundy/6 px-5 py-4 xl:px-6 xl:py-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-elite-burgundy text-elite-cream flex items-center justify-center shadow-lg shadow-elite-burgundy/25">
                                      {renderIcon(selectedCategory.icon)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-3">
                                        <h2 className="font-calistoga text-elite-black text-xl xl:text-[1.45rem] font-bold leading-tight tracking-[-0.01em]">
                                          {selectedCategory.name}
                                        </h2>
                                        <span className="inline-flex rounded-full bg-elite-burgundy/8 px-2.5 py-0.5 font-cabin text-[11px] font-semibold text-elite-burgundy">
                                          {t("itemsAvailable", {
                                            count:
                                              selectedCategory.subCategories[0]
                                                ?.items.length || 0,
                                          })}
                                        </span>
                                      </div>
                                      {selectedCategory.description && (
                                        <p className="mt-1 font-cabin text-[13px] text-elite-black/45 max-w-md xl:max-w-lg line-clamp-1">
                                          {selectedCategory.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Mobile category header */}
                              <div className="lg:hidden px-4 pt-2 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-elite-burgundy text-elite-cream flex items-center justify-center shadow-md shadow-elite-burgundy/25">
                                    {renderIcon(selectedCategory.icon)}
                                  </div>
                                  <div>
                                    <span className="inline-flex rounded-full bg-elite-burgundy/8 px-2 py-0.5 font-cabin text-[10px] font-semibold text-elite-burgundy">
                                      {t("itemsAvailable", {
                                        count:
                                          selectedCategory.subCategories[0]
                                            ?.items.length || 0,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Products grid */}
                              {selectedCategory.subCategories.length > 0 && (
                                <div className="px-3 sm:px-5 xl:px-7">
                                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 xl:gap-5">
                                    {selectedCategory.subCategories[0]?.items
                                      .filter(
                                        (item) =>
                                          item !== null && item !== undefined,
                                      )
                                      .map((item, itemIndex) => (
                                        <DrinkCard
                                          key={item.id}
                                          id={item.id}
                                          images={item.images}
                                          name={item.name}
                                          price={item.price}
                                          description={item.description}
                                          available={item.available}
                                          size="small"
                                          href={`/products/${item.id}`}
                                          menuItemId={item.id}
                                          showAddToOrder={true}
                                          categoryId={selectedCategory.id}
                                          imageVersion={productsLastUpdate}
                                          animationDelay={itemIndex * 25}
                                          onQuickAdd={() => {
                                            const product = (
                                              apiProducts || []
                                            ).find((p) => p.id === item.id);
                                            if (product) {
                                              setSelectedProduct(product);
                                              setIsModalOpen(true);
                                            }
                                          }}
                                        />
                                      ))}
                                  </div>
                                </div>
                              )}
                            </section>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}
