"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { sanitizeImages } from "@/lib/imageUtils";
import {
  ChevronRight,
  Coffee,
  Sparkles,
  Heart,
  Utensils,
  Home,
  RefreshCw,
} from "lucide-react";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import DrinkCard from "@/components/DrinkCard";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import MenuPageSkeleton from "@/components/skeletons/MenuPageSkeleton";
import ProductModal from "@/components/menu/ProductModal";
import { Product } from "@/hooks/useProducts";
import LocalizedLink from "@/components/LocalizedLink";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("menuPage");

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  // Fetch categories and products from API
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
    isEmpty: productsEmpty,
    lastUpdate: productsLastUpdate,
  } = useProducts();

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  // Group products by category from Odoo data only
  const categories = useMemo(() => {
    if (
      !apiCategories ||
      !Array.isArray(apiCategories) ||
      apiCategories.length === 0
    ) {
      return [];
    }

    // Filter products to only include those with valid categoryId
    // (excludes orphaned products with null categoryId)
    const validProducts = (apiProducts || []).filter((p) => p?.categoryId);

    return apiCategories
      .map((cat) => {
        if (!cat || !cat.id) return null;

        const categoryProducts = validProducts.filter(
          (p) => p?.categoryId === cat.id,
        );

        // Skip empty categories entirely
        if (categoryProducts.length === 0) {
          return null;
        }

        return {
          id: cat.id,
          name: cat.name || t("fallback.unknownCategory"),
          description: cat.description || t("fallback.categoryDescription"),
          icon: "coffee",
          comingSoon: false, // Never show coming soon since we filter empty ones
          subCategories: [
            {
              id: cat.id,
              name: cat.name || t("fallback.unknownCategory"),
              items: categoryProducts
                .map((p) => {
                  if (!p || !p.id) return null;
                  return {
                    id: p.id,
                    name: p.name || t("fallback.unknownProduct"),
                    description: p.description || "",
                    price: typeof p.price === "number" ? p.price : 0,
                    images: sanitizeImages(p.images),
                    available: p.available !== false,
                  };
                })
                .filter(Boolean),
            },
          ],
        };
      })
      .filter(Boolean);
  }, [apiCategories, apiProducts, t]);

  const visibleCategories = useMemo(
    () =>
      categories
        .filter((cat) => cat !== null && cat !== undefined)
        .filter(
          (category) => !activeCategory || category.id === activeCategory,
        ),
    [categories, activeCategory],
  );

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

  const handleRetry = () => {
    refetchCategories();
    refetchProducts();
  };

  useEffect(() => {
    const targetProductId = searchParams.get("productId")?.trim();
    const targetProductName = searchParams.get("product")?.trim();

    if (!targetProductId && !targetProductName) {
      return;
    }

    if (loading || !Array.isArray(apiProducts) || apiProducts.length === 0) {
      return;
    }

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const queryTokens = targetProductName
      ? normalize(targetProductName).split(" ").filter(Boolean)
      : [];

    const matchedProduct = apiProducts.find((product) => {
      if (!product) return false;
      if (targetProductId && product.id === targetProductId) return true;
      if (!targetProductName || !product.name) return false;

      const normalizedProductName = normalize(product.name);
      const normalizedTargetName = normalize(targetProductName);

      if (normalizedProductName === normalizedTargetName) {
        return true;
      }

      // Allow deep-links like "Taro Matcha" to match variants such as
      // "Iced Taro Matcha Latte", but avoid matching names missing tokens.
      return queryTokens.length > 0
        ? queryTokens.every((token) => normalizedProductName.includes(token))
        : false;
    });

    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
      setIsModalOpen(true);
      setActiveCategory(matchedProduct.categoryId || null);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("product");
    nextParams.delete("productId");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [apiProducts, loading, pathname, router, searchParams]);

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />

      {/* Full-height background that flows behind content */}
      <div className="relative min-h-screen bg-gradient-to-b from-elite-cream via-[#f8f0e4] to-[#f3e6d8] pb-24 md:pb-0">
        {/* Hero — premium heading with soft atmospheric gradients */}
        <div className="relative overflow-hidden bg-transparent pt-6 pb-8 md:pt-16 md:pb-14 lg:pb-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-10 start-0 h-52 w-52 rounded-full bg-white/75 blur-3xl sm:h-64 sm:w-64" />
            <div className="absolute -bottom-12 end-0 h-60 w-60 rounded-full bg-elite-burgundy/[0.07] blur-3xl sm:h-72 sm:w-72" />
            <div className="absolute inset-x-0 top-1/2 h-28 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="pointer-events-none absolute inset-x-8 top-6 h-24 bg-gradient-to-r from-transparent via-white/55 to-transparent blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-elite-burgundy/35 sm:w-12" />
                <span className="inline-flex items-center gap-2 rounded-full border border-elite-burgundy/15 bg-white/75 px-4 py-2 font-cabin text-[11px] font-bold uppercase tracking-[0.24em] text-elite-burgundy/75 sm:text-xs">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                  {t("sidebar.title")}
                </span>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-elite-burgundy/35 sm:w-12" />
              </div>

              <h1 className="max-w-4xl font-calistoga text-[2.4rem] leading-[1.05] tracking-[-0.02em] text-elite-black drop-shadow-[0_2px_6px_rgba(255,255,255,0.35)] sm:text-5xl md:text-[3.45rem] lg:text-[4rem]">
                {t("title")}
              </h1>

              <div className="my-4 h-px w-28 bg-gradient-to-r from-transparent via-elite-burgundy/45 to-transparent" />

              <p className="mx-auto max-w-2xl font-cabin text-sm leading-relaxed text-elite-black/62 sm:text-base md:text-lg">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-20">
          {/* Main content area — mobile only (desktop uses two-panel below) */}
          <div className="relative min-h-[60vh] lg:min-h-0 bg-transparent pt-2 md:pt-8 lg:pt-0">
            <div className="mx-auto max-w-[1520px] px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
              {/* Loading State with Skeletons */}
              {loading && <MenuPageSkeleton />}

              {/* Error State */}
              {error && !loading && (
                <ErrorState error={error} onRetry={handleRetry} size="large" />
              )}

              {/* Empty State - No Categories */}
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

              {/* Menu Content */}
              {!loading && !error && categories.length > 0 && (
                <>
                  {/* Mobile Category Pills - Sticky + premium design */}
                  <div className="lg:hidden sticky top-14 z-30 -mx-4 mb-5 border-b border-elite-burgundy/8 bg-elite-cream/85 px-4 backdrop-blur-md">
                    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
                      <div className="flex gap-2 py-2.5 min-w-max snap-x snap-mandatory">
                        {/* All categories button */}
                        <button
                          onClick={() => setActiveCategory(null)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap touch-manipulation active:scale-95 snap-start ${
                            activeCategory === null
                              ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20 ring-2 ring-elite-burgundy/20 ring-offset-1 ring-offset-white"
                              : "bg-elite-cream text-elite-black/70 border border-elite-burgundy/12 active:bg-elite-burgundy/5"
                          }`}
                        >
                          <span
                            className={`font-cabin text-sm ${activeCategory === null ? "font-bold" : "font-medium"}`}
                          >
                            {t("actions.all")}
                          </span>
                        </button>

                        {categories
                          .filter((cat) => cat !== null && cat !== undefined)
                          .map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() =>
                                  setActiveCategory(isActive ? null : cat.id)
                                }
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap touch-manipulation active:scale-95 snap-start ${
                                  isActive
                                    ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20 ring-2 ring-elite-burgundy/20 ring-offset-1 ring-offset-white"
                                    : cat.comingSoon
                                      ? "bg-elite-dark-cream/60 text-elite-black/40 cursor-not-allowed"
                                      : "bg-elite-cream text-elite-black/70 border border-elite-burgundy/12 active:bg-elite-burgundy/5"
                                }`}
                                disabled={cat.comingSoon}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                    isActive
                                      ? "bg-elite-cream"
                                      : "bg-elite-burgundy/50"
                                  }`}
                                />
                                <span
                                  className={`font-cabin text-sm ${isActive ? "font-bold" : "font-medium"}`}
                                >
                                  {cat.name}
                                </span>
                                {cat.comingSoon && (
                                  <span className="text-[10px] bg-elite-burgundy/30 text-elite-cream px-1.5 py-0.5 rounded-full font-medium">
                                    {t("actions.soon")}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    {/* Main Content Area */}
                    <div className="min-w-0">
                      {/* Desktop filter pills — hidden, replaced by sidebar */}

                      {/* Mobile: Category sections on unified page background */}
                      <div className="lg:hidden -mx-3 sm:-mx-6">
                        {visibleCategories.map((category, catIndex) => {
                          const isEven = catIndex % 2 === 0;
                          const bgClass = isEven
                            ? "bg-white"
                            : "bg-elite-cream";

                          return (
                            <div key={category.id}>
                              {/* Wave transition between sections */}
                              {catIndex > 0 && (
                                <div
                                  className={`wave-divider -mb-px ${catIndex % 2 === 0 ? "bg-elite-cream" : "bg-white"}`}
                                  aria-hidden="true"
                                >
                                  <svg
                                    viewBox="0 0 1440 48"
                                    preserveAspectRatio="none"
                                    className="w-full h-5 sm:h-8"
                                  >
                                    <path
                                      d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z"
                                      fill={
                                        isEven ? "white" : "var(--elite-cream)"
                                      }
                                    />
                                  </svg>
                                </div>
                              )}

                              <section
                                className={`relative px-4 sm:px-6 ${catIndex === 0 ? "pt-2" : "pt-4"} pb-6 ${bgClass}`}
                              >
                                {/* Category Header */}
                                <div
                                  className={`mb-5 px-4 py-4 ${
                                    catIndex === 0
                                      ? ""
                                      : "rounded-2xl bg-gradient-to-b from-elite-burgundy/[0.04] to-transparent border border-elite-burgundy/6"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                                          category.comingSoon
                                            ? "bg-elite-dark-cream text-elite-burgundy/50"
                                            : "bg-elite-burgundy text-elite-cream shadow-lg shadow-elite-burgundy/25"
                                        }`}
                                      >
                                        {renderIcon(category.icon)}
                                      </div>
                                      <div>
                                        <h3 className="font-calistoga text-elite-black text-[1.25rem] font-bold leading-tight tracking-[-0.01em]">
                                          {category.name}
                                        </h3>
                                        <span className="inline-flex items-center mt-1 font-cabin text-elite-black/45 text-[11px] font-medium">
                                          {t("itemsCount", {
                                            count:
                                              category.subCategories[0]?.items
                                                .length || 0,
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                    {!category.comingSoon && (
                                      <LocalizedLink
                                        href={`/menu/${category.id}`}
                                        className="flex items-center gap-1 font-cabin text-sm text-elite-cream font-semibold px-4 py-2 rounded-full bg-elite-burgundy shadow-md shadow-elite-burgundy/15 active:scale-95 transition-all touch-manipulation"
                                      >
                                        {t("actions.seeAll")}
                                        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                                      </LocalizedLink>
                                    )}
                                  </div>
                                </div>

                                {/* Products - 2-column grid for browsable layout */}
                                {!category.comingSoon &&
                                  category.subCategories.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 px-1">
                                      {category.subCategories[0]?.items
                                        .filter(
                                          (item) =>
                                            item !== null && item !== undefined,
                                        )
                                        .slice(0, 10)
                                        .map((item, idx) => (
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
                                            categoryId={category.id}
                                            imageVersion={productsLastUpdate}
                                            animationDelay={
                                              catIndex * 80 + idx * 40
                                            }
                                            onQuickAdd={() => {
                                              const product = apiProducts.find(
                                                (p) => p.id === item.id,
                                              );
                                              if (product) {
                                                setSelectedProduct(product);
                                                setIsModalOpen(true);
                                              }
                                            }}
                                          />
                                        ))}
                                    </div>
                                  )}

                                {/* Coming Soon State */}
                                {category.comingSoon && (
                                  <div className="bg-elite-dark-cream/30 rounded-2xl p-6 text-center">
                                    <span className="font-cabin text-elite-black/40 text-sm">
                                      {t("actions.comingSoon")}
                                    </span>
                                  </div>
                                )}
                              </section>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Empty State */}
              {!loading && !error && categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Coffee className="w-16 h-16 text-elite-burgundy/40 mb-4" />
                  <h3 className="text-elite-black font-calistoga text-2xl mb-2">
                    {t("empty.title")}
                  </h3>
                  <p className="text-elite-black/60 font-cabin mb-4">
                    {t("empty.description")}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:opacity-90 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("actions.refresh")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Two-panel layout — sidebar + flowing sections */}
          {!loading && !error && categories.length > 0 && (
            <div className="hidden lg:block">
              <div className="mx-auto max-w-[1520px] px-8 xl:px-10 2xl:px-12 pt-6 pb-10">
                <div className="flex gap-7 xl:gap-9 items-start">
                  {/* ── Sticky Sidebar — scrollable ── */}
                  <aside className="w-[230px] xl:w-[250px] flex-shrink-0 sticky top-20 self-start">
                    <div className="rounded-2xl border border-elite-burgundy/8 bg-elite-cream/65 shadow-[0_8px_30px_rgba(139,38,53,0.06)] backdrop-blur-sm overflow-hidden">
                      <div className="px-5 pt-5 pb-3">
                        <h2 className="font-calistoga text-lg text-elite-black tracking-[-0.01em]">
                          {t("sidebar.title")}
                        </h2>
                        <p className="font-cabin text-xs text-elite-black/45 mt-0.5">
                          {t("sidebar.subtitle")}
                        </p>
                      </div>

                      {/* Scrollable nav */}
                      <nav className="flex flex-col gap-0.5 px-3 pb-3 max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-hide">
                        <button
                          onClick={() => setActiveCategory(null)}
                          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-start font-cabin text-sm transition-all duration-200 ${
                            activeCategory === null
                              ? "bg-elite-burgundy text-elite-cream font-semibold shadow-md shadow-elite-burgundy/20"
                              : "text-elite-black/70 hover:bg-elite-cream/80 font-medium"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              activeCategory === null
                                ? "bg-elite-cream"
                                : "bg-elite-burgundy/40"
                            }`}
                          />
                          {t("actions.all")}
                        </button>

                        {categories
                          .filter((cat) => cat !== null && cat !== undefined)
                          .map((cat) => {
                            const isActive = activeCategory === cat.id;
                            const itemCount =
                              cat.subCategories?.[0]?.items?.length || 0;

                            return (
                              <button
                                key={`sidebar-${cat.id}`}
                                onClick={() =>
                                  setActiveCategory(isActive ? null : cat.id)
                                }
                                className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-start font-cabin text-sm transition-all duration-200 group ${
                                  isActive
                                    ? "bg-elite-burgundy text-elite-cream font-semibold shadow-md shadow-elite-burgundy/20"
                                    : cat.comingSoon
                                      ? "text-elite-black/35 cursor-not-allowed"
                                      : "text-elite-black/70 hover:bg-elite-cream/80 font-medium"
                                }`}
                                disabled={cat.comingSoon}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isActive
                                      ? "bg-elite-cream/20"
                                      : cat.comingSoon
                                        ? "bg-elite-dark-cream/50"
                                        : "bg-elite-burgundy/8 group-hover:bg-elite-burgundy/12"
                                  }`}
                                >
                                  <span className="text-[14px]">
                                    {renderIcon(cat.icon)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block truncate">
                                    {cat.name}
                                  </span>
                                  {!cat.comingSoon && (
                                    <span
                                      className={`text-[11px] ${
                                        isActive
                                          ? "text-elite-cream/70"
                                          : "text-elite-black/40"
                                      }`}
                                    >
                                      {t("itemsCount", {
                                        count: itemCount,
                                      })}
                                    </span>
                                  )}
                                  {cat.comingSoon && (
                                    <span className="text-[10px] text-elite-burgundy/50 font-semibold uppercase tracking-wider">
                                      {t("actions.soon")}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                      </nav>

                      <div className="px-5 py-3 border-t border-elite-burgundy/8 bg-transparent">
                        <p className="font-cabin text-[11px] text-elite-black/35 leading-relaxed">
                          {t("sidebar.footer")}
                        </p>
                      </div>
                    </div>
                  </aside>

                  {/* ── Main Content — flowing sections with wave transitions ── */}
                  <div className="flex-1 min-w-0 rounded-[1.75rem] overflow-hidden shadow-[0_4px_24px_rgba(139,38,53,0.05)]">
                    {visibleCategories.map((category, catIndex) => {
                      const isEven = catIndex % 2 === 0;
                      const bgClass = isEven ? "bg-white" : "bg-elite-cream";

                      return (
                        <div key={category.id}>
                          {/* Wave transition between sections */}
                          {catIndex > 0 && (
                            <div
                              className={`wave-divider -mb-px ${isEven ? "bg-elite-cream" : "bg-white"}`}
                              aria-hidden="true"
                            >
                              <svg
                                viewBox="0 0 1200 40"
                                preserveAspectRatio="none"
                                className="w-full h-6 xl:h-8"
                              >
                                <path
                                  d="M0,0 C400,40 800,40 1200,0 L1200,40 L0,40 Z"
                                  fill={isEven ? "white" : "var(--elite-cream)"}
                                />
                              </svg>
                            </div>
                          )}

                          <section
                            className={`relative ${bgClass} ${catIndex === 0 ? "pt-5" : "pt-4"} pb-6 xl:pb-8`}
                          >
                            {/* Category Header — premium banner */}
                            <div
                              className={`relative mx-5 xl:mx-7 mb-5 px-5 py-4 xl:px-6 xl:py-5 ${
                                catIndex === 0
                                  ? ""
                                  : "rounded-2xl border border-elite-burgundy/8 bg-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-12 h-12 xl:w-13 xl:h-13 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105 ${
                                      category.comingSoon
                                        ? "bg-elite-dark-cream text-elite-burgundy/50"
                                        : "bg-elite-burgundy text-elite-cream shadow-lg shadow-elite-burgundy/25"
                                    }`}
                                  >
                                    {renderIcon(category.icon)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-calistoga text-elite-black text-xl xl:text-[1.45rem] font-bold leading-tight tracking-[-0.01em]">
                                        {category.name}
                                      </h3>
                                      <span className="inline-flex rounded-full bg-elite-burgundy/8 px-2.5 py-0.5 font-cabin text-[11px] font-semibold text-elite-burgundy">
                                        {t("itemsCount", {
                                          count:
                                            category.subCategories[0]?.items
                                              .length || 0,
                                        })}
                                      </span>
                                    </div>
                                    <p className="mt-1 font-cabin text-[13px] text-elite-black/45 max-w-md xl:max-w-lg line-clamp-1">
                                      {category.description}
                                    </p>
                                  </div>
                                </div>
                                {!category.comingSoon && (
                                  <LocalizedLink
                                    href={`/menu/${category.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-elite-burgundy px-5 py-2.5 font-cabin text-sm font-semibold text-elite-cream shadow-md shadow-elite-burgundy/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-elite-burgundy/25"
                                  >
                                    {t("actions.seeAll")}
                                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                                  </LocalizedLink>
                                )}
                              </div>
                            </div>

                            {/* Products Grid */}
                            {!category.comingSoon &&
                              category.subCategories.length > 0 && (
                                <div className="px-5 xl:px-7">
                                  <div className="grid grid-cols-3 gap-4 xl:grid-cols-4 xl:gap-5">
                                    {category.subCategories[0]?.items
                                      .filter(
                                        (item) =>
                                          item !== null && item !== undefined,
                                      )
                                      .map((item, idx) => (
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
                                          categoryId={category.id}
                                          imageVersion={productsLastUpdate}
                                          animationDelay={idx * 25}
                                          onQuickAdd={() => {
                                            const product = apiProducts.find(
                                              (p) => p.id === item.id,
                                            );
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

                            {/* Coming Soon State */}
                            {category.comingSoon && (
                              <div className="px-5 xl:px-7 text-center py-4">
                                <div className="inline-flex items-center gap-2 rounded-full bg-elite-dark-cream/40 px-5 py-2.5 font-cabin text-sm text-elite-black/40 font-medium">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  {t("actions.comingSoon")}
                                </div>
                              </div>
                            )}
                          </section>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
