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
import MobileHeader from "@/components/MobileHeader";
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
      <div className="hidden md:block"></div>
      <MobileHeader title={t("title")} showBack={true} transparent={true} />

      {/* Full-height background that flows behind content */}
      <div className="min-h-screen bg-elite-cream pb-24 md:pb-0">
        <div className="relative overflow-hidden bg-elite-cream pt-16 pb-10 md:pt-24 md:pb-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-0 h-44 w-44 rounded-full bg-white/70 blur-3xl sm:h-56 sm:w-56" />
            <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-elite-burgundy/[0.05] blur-3xl sm:h-64 sm:w-64" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/10 bg-white/80 px-4 py-2 font-cabin text-xs font-bold uppercase tracking-[0.22em] text-elite-burgundy/72">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              {t("sidebar.title")}
            </span>
            <h1 className="mb-4 font-calistoga text-4xl text-elite-black sm:text-5xl md:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-2xl font-cabin text-sm leading-relaxed text-elite-black/60 sm:text-base md:text-lg">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-20">
          {/* Main content area */}
          <div className="relative min-h-[60vh] bg-elite-cream pt-4 md:pt-8">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-10">
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
                  <div className="lg:hidden sticky top-16 z-30 -mx-4 mb-5 border-b border-elite-burgundy/8 bg-elite-cream/95 px-4 backdrop-blur-md">
                    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
                      <div className="flex gap-2 py-2.5 min-w-max snap-x snap-mandatory">
                        {/* All categories button */}
                        <button
                          onClick={() => setActiveCategory(null)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap touch-manipulation active:scale-95 snap-start ${
                            activeCategory === null
                              ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20"
                              : "bg-white text-elite-black/70 border border-elite-burgundy/12 active:bg-elite-burgundy/5"
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
                                    ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20"
                                    : cat.comingSoon
                                      ? "bg-elite-dark-cream/60 text-elite-black/40 cursor-not-allowed"
                                      : "bg-white text-elite-black/70 border border-elite-burgundy/12 active:bg-elite-burgundy/5"
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

                  <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 min-w-0">
                    {/* Desktop Sidebar - Hidden on Mobile */}
                    <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
                      <div className="sidebar-scroll sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[1.75rem] border border-elite-burgundy/10 bg-white/90 p-6 shadow-lg shadow-elite-burgundy/5 backdrop-blur-sm">
                        {/* Sidebar Header */}
                        <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
                          <h2 className="font-calistoga text-elite-burgundy text-2xl font-bold mb-2">
                            {t("sidebar.title")}
                          </h2>
                          <p className="font-cabin text-elite-black/70 text-sm">
                            {t("sidebar.subtitle")}
                          </p>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-1">
                          {categories
                            .filter((cat) => cat !== null && cat !== undefined)
                            .map((cat, index) => (
                              <div key={cat.id}>
                                <LocalizedLink
                                  href={
                                    cat.comingSoon ? "#" : `/menu/${cat.id}`
                                  }
                                  className={`group sidebar-item flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
                                    cat.comingSoon
                                      ? "bg-elite-dark-cream text-elite-black/50 cursor-not-allowed border-elite-dark-cream"
                                      : "bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-102 border-elite-burgundy/20 hover:border-elite-burgundy"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        cat.comingSoon
                                          ? "bg-elite-black/20"
                                          : "bg-elite-burgundy group-hover:bg-elite-cream"
                                      }`}
                                    ></div>
                                    <span className="font-cabin font-semibold text-base">
                                      {cat.name}
                                    </span>
                                  </div>
                                  {cat.comingSoon && (
                                    <span className="text-xs bg-elite-burgundy/40 text-elite-cream/90 px-2 py-0.5 rounded-full font-medium">
                                      {t("actions.soon")}
                                    </span>
                                  )}
                                </LocalizedLink>
                                {index < categories.length - 1 && (
                                  <div className="h-px bg-elite-burgundy/10 my-3"></div>
                                )}
                              </div>
                            ))}
                        </div>

                        {/* Sidebar Footer */}
                        <div className="mt-6 pt-4 border-t border-elite-burgundy/20">
                          <div className="text-center">
                            <p className="font-cabin text-elite-black/40 text-xs">
                              {t("sidebar.footer")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="min-w-0 flex-1">
                      {/* Mobile: Native scrollable category sections */}
                      <div className="lg:hidden space-y-6">
                        {categories
                          .filter((cat) => cat !== null && cat !== undefined)
                          .filter(
                            (category) =>
                              !activeCategory || category.id === activeCategory,
                          )
                          .map((category, catIndex) => (
                            <section key={category.id} className="relative">
                              {/* Category Header - Sticky on scroll */}
                              <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                      category.comingSoon
                                        ? "bg-elite-dark-cream text-elite-burgundy/50"
                                        : "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20"
                                    }`}
                                  >
                                    {renderIcon(category.icon)}
                                  </div>
                                  <div>
                                    <h3 className="font-calistoga text-elite-black text-xl font-bold leading-tight">
                                      {category.name}
                                    </h3>
                                    <p className="font-cabin text-elite-black/50 text-xs">
                                      {t("itemsCount", {
                                        count:
                                          category.subCategories[0]?.items
                                            .length || 0,
                                      })}
                                    </p>
                                  </div>
                                </div>
                                {!category.comingSoon && (
                                  <LocalizedLink
                                    href={`/menu/${category.id}`}
                                    className="font-cabin text-sm text-elite-burgundy font-semibold px-3 py-1.5 rounded-full bg-elite-burgundy/8 active:bg-elite-burgundy/15 transition-colors touch-manipulation"
                                  >
                                    {t("actions.seeAll")}
                                  </LocalizedLink>
                                )}
                              </div>

                              {/* Products - Horizontal scroll for native feel */}
                              {!category.comingSoon &&
                                category.subCategories.length > 0 && (
                                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-2">
                                    <div className="flex gap-3 snap-x snap-mandatory">
                                      {category.subCategories[0]?.items
                                        .filter(
                                          (item) =>
                                            item !== null && item !== undefined,
                                        )
                                        .slice(0, 8)
                                        .map((item, idx) => (
                                          <div
                                            key={item.id}
                                            className="w-[160px] flex-shrink-0 snap-start"
                                          >
                                            <DrinkCard
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
                                                catIndex * 100 + idx * 30
                                              }
                                              onQuickAdd={() => {
                                                const product =
                                                  apiProducts.find(
                                                    (p) => p.id === item.id,
                                                  );
                                                if (product) {
                                                  setSelectedProduct(product);
                                                  setIsModalOpen(true);
                                                }
                                              }}
                                            />
                                          </div>
                                        ))}
                                    </div>
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

                              {/* Subtle divider */}
                              {catIndex <
                                categories.filter(
                                  (c) =>
                                    c !== null &&
                                    (!activeCategory ||
                                      c.id === activeCategory),
                                ).length -
                                  1 && (
                                <div className="h-px bg-gradient-to-r from-transparent via-elite-burgundy/10 to-transparent mt-6" />
                              )}
                            </section>
                          ))}
                      </div>

                      {/* Desktop: Grid layout */}
                      <div className="hidden space-y-8 lg:block">
                        {categories
                          .filter((cat) => cat !== null && cat !== undefined)
                          .filter(
                            (category) =>
                              !activeCategory || category.id === activeCategory,
                          )
                          .map((category, index) => (
                            <div key={category.id} className="relative">
                              <div className="w-full rounded-[1.75rem] border border-elite-burgundy/10 bg-white/70 p-5 backdrop-blur-sm sm:p-6 lg:p-8">
                                {category.comingSoon && (
                                  <div className="absolute inset-0 bg-elite-cream/80 rounded-2xl z-10" />
                                )}

                                <div
                                  className={
                                    category.comingSoon ? "opacity-40" : ""
                                  }
                                >
                                  {/* Category Header */}
                                  <div className="flex items-center gap-4 mb-6">
                                    <div
                                      className={`p-4 rounded-xl ${
                                        category.comingSoon
                                          ? "bg-elite-dark-cream text-elite-burgundy"
                                          : "bg-elite-burgundy text-elite-cream"
                                      }`}
                                    >
                                      {renderIcon(category.icon)}
                                    </div>
                                    <div>
                                      <h3 className="font-calistoga text-elite-black text-3xl font-bold">
                                        {category.name}
                                      </h3>
                                      {category.comingSoon && (
                                        <span className="bg-elite-burgundy/60 text-elite-cream/80 px-3 py-1 rounded-full text-sm font-cabin font-bold">
                                          {t("actions.comingSoon")}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Products - Horizontal scroll */}
                                  {!category.comingSoon &&
                                    category.subCategories.length > 0 && (
                                      <div className="overflow-x-auto menu-items-scroll scrollbar-hide -mx-8 px-8 py-4">
                                        <div className="flex gap-5 pb-4">
                                          {category.subCategories[0]?.items
                                            .filter(
                                              (item) =>
                                                item !== null &&
                                                item !== undefined,
                                            )
                                            .map((item, idx) => (
                                              <div
                                                key={item.id}
                                                className="w-72 flex-shrink-0 snap-start"
                                              >
                                                <DrinkCard
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
                                                  imageVersion={
                                                    productsLastUpdate
                                                  }
                                                  animationDelay={idx * 30}
                                                  onQuickAdd={() => {
                                                    const product =
                                                      apiProducts.find(
                                                        (p) => p.id === item.id,
                                                      );
                                                    if (product) {
                                                      setSelectedProduct(
                                                        product,
                                                      );
                                                      setIsModalOpen(true);
                                                    }
                                                  }}
                                                />
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                              {index <
                                categories.filter(
                                  (c) =>
                                    c !== null &&
                                    (!activeCategory ||
                                      c.id === activeCategory),
                                ).length -
                                  1 && (
                                <div className="h-px bg-elite-burgundy/10 mt-8" />
                              )}
                            </div>
                          ))}
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
