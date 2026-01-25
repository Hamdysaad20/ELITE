"use client";

import { useState, useMemo } from "react";
import { useDeals, DealProduct, Deal } from "@/hooks/useDeals";
import { sanitizeImages } from "@/lib/imageUtils";
import { Tag, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import DrinkCard from "@/components/DrinkCard";
import ComboDealCard from "@/components/ComboDealCard";
import DealCard from "@/components/deals/DealCard";
import type { ComboDeal } from "@/types/deals";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import ProductModal from "@/components/menu/ProductModal";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import UserActivationCTA from "@/components/deals/UserActivationCTA";
import DealSortFilter, {
  type DealSortOption,
} from "@/components/deals/DealSortFilter";
import { useTranslations } from "next-intl";

export default function DealsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<DealSortOption>("discount-desc"); // Default: biggest discount first
  const t = useTranslations("dealsPage");

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  // Fetch all deals from API
  const { deals, loading, error, refetch, isEmpty, totalProducts } =
    useDeals(true);

  const handleRetry = () => {
    refetch();
  };

  // Convert DealProduct to Product for modal
  const convertToProduct = (dealProduct: DealProduct): Product => {
    return {
      id: dealProduct.id,
      name: dealProduct.name,
      description: dealProduct.description,
      price: dealProduct.dealActive
        ? dealProduct.dealPrice
        : dealProduct.originalPrice,
      categoryId: dealProduct.categoryId,
      images: dealProduct.images,
      available: dealProduct.available !== false && dealProduct.dealActive,
      sku: dealProduct.sku,
      stock: undefined,
      sequence: undefined,
    };
  };

  // Filter to only show active deals
  const activeDeals = (deals || []).filter(
    (deal) =>
      deal.active &&
      (deal.products.length > 0 || (deal.combos && deal.combos.length > 0)),
  );

  // Check if any deal is active
  const hasActiveDeals = activeDeals.length > 0;

  // Sort products within each deal by discount (biggest first by default)
  const sortedDeals = useMemo(() => {
    return activeDeals.map((deal) => {
      const sortedProducts = [...deal.products].sort((a, b) => {
        switch (sortBy) {
          case "discount-desc":
            return (b.savingsPercent || 0) - (a.savingsPercent || 0);
          case "discount-asc":
            return (a.savingsPercent || 0) - (b.savingsPercent || 0);
          case "savings-desc":
            return (b.savings || 0) - (a.savings || 0);
          case "savings-asc":
            return (a.savings || 0) - (b.savings || 0);
          case "price-desc":
            return (b.dealPrice || 0) - (a.dealPrice || 0);
          case "price-asc":
            return (a.dealPrice || 0) - (b.dealPrice || 0);
          case "name-asc":
            return (a.name || "").localeCompare(b.name || "");
          case "name-desc":
            return (b.name || "").localeCompare(a.name || "");
          default:
            return (b.savingsPercent || 0) - (a.savingsPercent || 0);
        }
      });

      return {
        ...deal,
        products: sortedProducts,
      };
    });
  }, [activeDeals, sortBy]);

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block"></div>
      <MobileHeader title={t("title")} showBack={true} transparent={true} />

      {/* Full-height background */}
      <div className="min-h-screen bg-elite-burgundy pb-24 md:pb-0">
        {/* Header - Matching shop page style */}
        <div className="bg-elite-burgundy text-elite-cream py-20 relative overflow-hidden pt-14 md:pt-20">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-elite-cream/30 rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 border border-elite-cream/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-elite-cream/20 rounded-full"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <h1 className="font-calistoga text-6xl md:text-7xl font-bold mb-6">
              {t("title")}
            </h1>
            <p className="font-cabin text-xl md:text-2xl text-elite-cream/90 max-w-3xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-20">
          {/* Main content area */}
          <div className="relative bg-elite-cream pt-8 md:pt-12 min-h-[60vh]">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12">
              {/* Enhanced Status Banner */}
              {!loading && !error && activeDeals && activeDeals.length > 0 && (
                <div
                  className={cn(
                    "mb-8 rounded-3xl p-5 md:p-7 border-2",
                    "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50",
                    "border-emerald-300/50 shadow-lg shadow-emerald-200/20",
                    "relative overflow-hidden",
                  )}
                >
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200/20 rounded-full blur-xl -ml-12 -mb-12" />

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-calistoga text-xl md:text-2xl mb-2 text-emerald-900">
                        {t("status.activeDeals", {
                          count: activeDeals.length,
                        })}
                      </h3>
                      <p className="font-cabin text-sm md:text-base text-emerald-800/90 leading-relaxed">
                        {t("status.description", {
                          products: totalProducts,
                          deals: activeDeals.length,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sort Filter */}
              {!loading && !error && sortedDeals && sortedDeals.length > 0 && (
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex-1" />
                  <DealSortFilter
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    productCount={totalProducts}
                  />
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="py-12">
                  <LoadingState size="large" />
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <ErrorState error={error} onRetry={handleRetry} size="large" />
              )}

              {/* Empty State */}
              {!loading &&
                !error &&
                (!activeDeals || activeDeals.length === 0) && (
                  <EmptyState
                    variant="no-products"
                    title={t("empty.title")}
                    description={t("empty.description")}
                    actionLabel={t("actions.refresh")}
                    onAction={handleRetry}
                  />
                )}

              {/* Enhanced Deals Content */}
              {!loading && !error && sortedDeals && sortedDeals.length > 0 && (
                <div className="space-y-8">
                  {sortedDeals.map((deal, dealIndex) => (
                    <div key={deal.id} className="relative">
                      {/* Background Container - Matching Menu Page Style */}
                      <div className="bg-white/50 rounded-2xl p-6 lg:p-8 w-full">
                        {/* Deal Header - Matching Menu Page Style */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-elite-burgundy"></div>
                              <div>
                                <h2 className="font-calistoga text-elite-black text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                                  {deal.name}
                                </h2>
                                <p className="font-cabin text-elite-black/50 text-xs mt-0.5">
                                  {t("deal.itemCount", {
                                    count:
                                      deal.products.length +
                                      (deal.combos?.length || 0),
                                  })}
                                </p>
                              </div>
                            </div>
                            {deal.active && (
                              <span className="inline-flex items-center gap-1.5 bg-elite-burgundy text-elite-cream px-3 py-1.5 rounded-full text-xs font-cabin font-bold shadow-sm">
                                <span className="w-1.5 h-1.5 bg-elite-cream rounded-full animate-pulse" />
                                {t("deal.active")}
                              </span>
                            )}
                          </div>
                          {deal.description && (
                            <p className="font-cabin text-elite-black/60 text-sm md:text-base ml-5 leading-relaxed">
                              {deal.description}
                            </p>
                          )}
                        </div>

                        {/* Enhanced Combo Deals Section */}
                        {deal.combos && deal.combos.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-elite-burgundy/20 to-transparent" />
                              <h3 className="font-calistoga text-elite-black text-xl md:text-2xl font-bold">
                                {t("combo.title")}
                              </h3>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-elite-burgundy/20 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                              {deal.combos.map((combo, comboIdx) => (
                                <ComboDealCard
                                  key={combo.id}
                                  combo={combo}
                                  animationDelay={
                                    dealIndex * 100 + comboIdx * 50
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Enhanced Products Grid */}
                        {deal.products.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                            {deal.products.map((dealProduct, idx) => {
                              return (
                                <DealCard
                                  key={dealProduct.id}
                                  id={dealProduct.id}
                                  name={dealProduct.name}
                                  images={sanitizeImages(dealProduct.images)}
                                  originalPrice={dealProduct.originalPrice}
                                  dealPrice={dealProduct.dealPrice}
                                  dealActive={dealProduct.dealActive}
                                  savings={dealProduct.savings}
                                  savingsPercent={dealProduct.savingsPercent}
                                  description={
                                    dealProduct.description ?? undefined
                                  }
                                  available={
                                    dealProduct.available !== false &&
                                    dealProduct.dealActive
                                  }
                                  categoryId={dealProduct.categoryId}
                                  onQuickAdd={() => {
                                    const product =
                                      convertToProduct(dealProduct);
                                    setSelectedProduct(product);
                                    setIsModalOpen(true);
                                  }}
                                  animationDelay={dealIndex * 100 + idx * 30}
                                  size="small"
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-elite-cream/50 rounded-2xl p-6 text-center">
                            <p className="font-cabin text-elite-black/60 text-sm">
                              {t("deal.noProducts")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced Info Box */}
              {!loading && !error && activeDeals && activeDeals.length > 0 && (
                <div className="mt-16 md:mt-20 bg-gradient-to-br from-white to-elite-cream/20 rounded-3xl p-6 md:p-8 border-2 border-elite-burgundy/15 shadow-lg relative overflow-hidden">
                  {/* Decorative background */}
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-elite-burgundy/5 rounded-full blur-2xl -ml-16 -mb-16" />

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy rounded-xl flex items-center justify-center shadow-md">
                      <AlertCircle className="w-5 h-5 text-elite-cream" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-calistoga text-elite-black text-lg md:text-xl mb-3 font-bold">
                        {t("info.title")}
                      </h3>
                      <ul className="font-cabin text-elite-black/75 text-sm md:text-base space-y-2.5">
                        <li className="flex items-start gap-2">
                          <span className="text-elite-burgundy font-bold mt-0.5">
                            •
                          </span>
                          <span>{t("info.items.0")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-elite-burgundy font-bold mt-0.5">
                            •
                          </span>
                          <span>
                            {t("info.items.1")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-elite-burgundy font-bold mt-0.5">
                            •
                          </span>
                          <span>{t("info.items.2")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-elite-burgundy font-bold mt-0.5">
                            •
                          </span>
                          <span>{t("info.items.3")}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* User Activation CTA */}
              {!loading && !error && activeDeals && activeDeals.length > 0 && (
                <div className="mt-8 md:mt-12">
                  <UserActivationCTA />
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
