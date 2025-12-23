"use client";

import { useState } from "react";
import { useDeals, DealProduct, Deal } from "@/hooks/useDeals";
import { sanitizeImages } from "@/lib/imageUtils";
import {
  Tag,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import DrinkCard from "@/components/DrinkCard";
import ComboDealCard from "@/components/ComboDealCard";
import type { ComboDeal } from "@/types/deals";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import ProductModal from "@/components/menu/ProductModal";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

export default function DealsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  // Fetch all deals from API
  const {
    deals,
    loading,
    error,
    refetch,
    isEmpty,
    totalProducts,
  } = useDeals(true);

  const handleRetry = () => {
    refetch();
  };

  // Convert DealProduct to Product for modal
  const convertToProduct = (dealProduct: DealProduct): Product => {
    return {
      id: dealProduct.id,
      name: dealProduct.name,
      description: dealProduct.description,
      price: dealProduct.dealActive ? dealProduct.dealPrice : dealProduct.originalPrice,
      categoryId: dealProduct.categoryId,
      images: dealProduct.images,
      available: dealProduct.available !== false && dealProduct.dealActive,
      sku: dealProduct.sku,
      stock: undefined,
      sequence: undefined,
    };
  };

  // Check if any deal is active
  const hasActiveDeals = deals.some(deal => deal.active && deal.products.length > 0);

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block"></div>
      <MobileHeader title="Deals" showBack={true} transparent={true} />

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
              Deals
            </h1>
            <p className="font-cabin text-xl md:text-2xl text-elite-cream/90 max-w-3xl mx-auto leading-relaxed">
              Special prices and exclusive offers on selected items
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-20">
          {/* Main content area */}
          <div className="relative bg-elite-cream pt-8 md:pt-12 min-h-[60vh]">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12">
              {/* Status Banner */}
              {!loading && !error && deals.length > 0 && (
                <div
                  className={cn(
                    "mb-6 rounded-2xl p-4 md:p-6 border-2",
                    hasActiveDeals
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-amber-50 border-amber-200",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className={cn(
                      "w-6 h-6 flex-shrink-0 mt-0.5",
                      hasActiveDeals ? "text-emerald-600" : "text-amber-600"
                    )} />
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "font-calistoga text-lg md:text-xl mb-1",
                          hasActiveDeals ? "text-emerald-900" : "text-amber-900",
                        )}
                      >
                        {hasActiveDeals
                          ? `🎉 ${deals.length} Active Deal${deals.length !== 1 ? "s" : ""}!`
                          : "⏰ Deals Available"}
                      </h3>
                      <p
                        className={cn(
                          "font-cabin text-sm md:text-base",
                          hasActiveDeals ? "text-emerald-700" : "text-amber-700",
                        )}
                      >
                        {hasActiveDeals
                          ? `Enjoy special prices on ${totalProducts} item${totalProducts !== 1 ? "s" : ""} across ${deals.length} deal${deals.length !== 1 ? "s" : ""}`
                          : "Browse our current deals and special offers"}
                      </p>
                    </div>
                  </div>
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
              {!loading && !error && isEmpty && (
                <EmptyState
                  variant="no-products"
                  title="No Deals Available"
                  description="Deal products are being synchronized. Please check back soon or contact support."
                  actionLabel="Refresh"
                  onAction={handleRetry}
                />
              )}

              {/* Deals Content */}
              {!loading && !error && deals.length > 0 && (
                <div className="space-y-12 md:space-y-16">
                  {deals.map((deal, dealIndex) => (
                    <div key={deal.id} className="space-y-6">
                      {/* Deal Header */}
                      <div className="border-b border-elite-burgundy/20 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Tag className="w-6 h-6 text-elite-burgundy" />
                          <h2 className="font-calistoga text-elite-black text-2xl md:text-3xl lg:text-4xl">
                            {deal.name}
                          </h2>
                          {deal.active && (
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-cabin font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        {deal.description && (
                          <p className="font-cabin text-elite-black/70 text-sm md:text-base ml-9">
                            {deal.description}
                          </p>
                        )}
                      </div>

                      {/* Combo Deals Section */}
                      {deal.combos && deal.combos.length > 0 && (
                        <div className="mb-8">
                          <h3 className="font-calistoga text-elite-black text-xl md:text-2xl mb-4">
                            Combo Deals
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {deal.combos.map((combo, comboIdx) => (
                              <ComboDealCard
                                key={combo.id}
                                combo={combo}
                                animationDelay={dealIndex * 100 + comboIdx * 50}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products Grid */}
                      {deal.products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                          {deal.products.map((dealProduct, idx) => {
                            // Use deal price if active, otherwise show original price
                            const displayPrice = dealProduct.dealActive
                              ? dealProduct.dealPrice
                              : dealProduct.originalPrice;

                            return (
                              <DrinkCard
                                key={dealProduct.id}
                                id={dealProduct.id}
                                images={sanitizeImages(dealProduct.images)}
                                name={dealProduct.name}
                                price={displayPrice}
                                description={dealProduct.description ?? undefined}
                                available={
                                  dealProduct.available !== false && dealProduct.dealActive
                                }
                                size="small"
                                href={`/products/${dealProduct.id}`}
                                menuItemId={dealProduct.id}
                                showAddToOrder={dealProduct.dealActive}
                                onQuickAdd={() => {
                                  const product = convertToProduct(dealProduct);
                                  setSelectedProduct(product);
                                  setIsModalOpen(true);
                                }}
                                animationDelay={dealIndex * 100 + idx * 30}
                                isDealsPage={true}
                                dealInfo={{
                                  originalPrice: dealProduct.originalPrice,
                                  dealPrice: dealProduct.dealPrice,
                                  dealActive: dealProduct.dealActive,
                                  savings: dealProduct.savings,
                                  savingsPercent: dealProduct.savingsPercent,
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-elite-cream/50 rounded-2xl p-6 text-center">
                          <p className="font-cabin text-elite-black/60 text-sm">
                            No products available in this deal
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Info Box */}
              {!loading && !error && deals.length > 0 && (
                <div className="mt-12 md:mt-16 bg-white/50 rounded-2xl p-6 md:p-8 border border-elite-burgundy/10">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-elite-burgundy flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-calistoga text-elite-black text-lg md:text-xl mb-2">
                        How Deals Work
                      </h3>
                      <ul className="font-cabin text-elite-black/70 text-sm md:text-base space-y-2">
                        <li>
                          • Deals are managed through Odoo pricelists
                        </li>
                        <li>
                          • Prices shown are final prices from Odoo (our inventory system)
                        </li>
                        <li>
                          • All prices are validated by Odoo at checkout
                        </li>
                        <li>
                          • Deals may have time restrictions or other conditions
                        </li>
                      </ul>
                    </div>
                  </div>
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
