"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DrinkCard from "@/components/DrinkCard";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";
import CategoryPillSkeleton from "@/components/skeletons/CategoryPillSkeleton";

export default function MenuPage() {
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
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
  } = useProducts();

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  // Group products by category from Odoo data only
  const categories = useMemo(() => {
    if (!apiCategories || !Array.isArray(apiCategories) || apiCategories.length === 0) {
      return [];
    }
    
    return apiCategories.map(cat => {
      if (!cat || !cat.id) return null;
      
      const categoryProducts = (apiProducts || []).filter(p => p?.categoryId === cat.id);
      
      // Skip empty categories entirely
      if (categoryProducts.length === 0) {
        return null;
      }
      
      return {
        id: cat.id,
        name: cat.name || "Unknown Category",
        description: cat.description || "Explore our selection",
        icon: "coffee",
        comingSoon: false, // Never show coming soon since we filter empty ones
        subCategories: [{
          id: cat.id,
          name: cat.name || "Unknown Category",
          items: categoryProducts.map(p => {
            if (!p || !p.id) return null;
            return {
              id: p.id,
              name: p.name || "Unnamed Product",
              description: p.description || "",
              price: typeof p.price === "number" ? p.price : 0,
              images: sanitizeImages(p.images),
              available: p.available !== false,
            };
          }).filter(Boolean)
        }]
      };
    }).filter(Boolean);
  }, [apiCategories, apiProducts]);

  // Using useMemo for hero images to prevent re-creation on every render
  const heroImages = useMemo(
    () => [
      "/images/Hero Items/1.svg",
      "/images/Hero Items/2.svg",
      "/images/Hero Items/3.svg",
    ],
    [],
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationPlayed(true);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  // Preload images for a smoother transition experience
  useEffect(() => {
    heroImages.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [heroImages]);

  // Image rotation logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handleRetry = () => {
    refetchCategories();
    refetchProducts();
  };

  return (
    <main>
      <Navigation />
      <div className="min-h-screen bg-elite-burgundy">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy via-elite-dark-burgundy to-elite-burgundy opacity-90"></div>

          <div className="relative min-h-[40vh] md:min-h-[60vh] w-full overflow-hidden">
            <div className="absolute inset-0 z-[1]">
              <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl md:text-[12rem] lg:text-[20rem] xl:text-[24rem] font-cabin font-bold text-elite-cream select-none pointer-events-none opacity-90">
                MENU
              </h1>
            </div>

            <div className="absolute inset-0 z-[5]">
              <div className="relative h-full w-full flex items-center justify-center pointer-events-none">
                {heroImages.map((imageSrc, index) => (
                  <img
                    key={imageSrc}
                    src={imageSrc}
                    alt={`Hero Image ${index + 1}`}
                    className={`absolute object-contain transition-opacity duration-1000 w-[60rem] h-[60rem] sm:w-[64rem] sm:h-[64rem] md:w-[32rem] md:h-[32rem] lg:w-[48rem] lg:h-[48rem] xl:w-[56rem] xl:h-[56rem] translate-y-[10%] md:translate-y-[20%] ${
                      index === currentHeroImage ? "opacity-100" : "opacity-0"
                    } ${
                      animationPlayed ? "drink-overlay-animation animated" : ""
                    }`}
                    aria-hidden={index !== currentHeroImage}
                  />
                ))}
              </div>
            </div>

            <div className="absolute inset-0 z-[10]">
              <h1
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl md:text-[12rem] lg:text-[20rem] xl:text-[24rem] font-cabin font-bold select-none pointer-events-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "4px #F5F5DC",
                }}
              >
                MENU
              </h1>
            </div>
          </div>
        </div>

        <div className="relative z-20 bg-elite-cream min-h-[25vh] rounded-t-[3rem] md:rounded-t-[3rem] -mt-8 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Loading State with Skeletons */}
            {loading && (
              <div className="space-y-8">
                <CategoryPillSkeleton count={6} />
                <ProductGridSkeleton count={8} />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <ErrorState
                error={error}
                onRetry={handleRetry}
                size="large"
              />
            )}
            
            {/* Empty State - No Categories */}
            {!loading && !error && (categoriesEmpty || categories.length === 0) && (
              <EmptyState
                variant="no-products"
                title="Catalog Not Synced"
                description="The product catalog needs to be synchronized from Odoo. Please contact an administrator or try refreshing."
                actionLabel="Refresh"
                onAction={handleRetry}
              />
            )}

            {/* Menu Content */}
            {!loading && !error && categories.length > 0 && (
              <>
                {/* Mobile Category Pills - Horizontal Scrollable */}
                <div className="lg:hidden mb-6">
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 py-4 px-2 min-w-max">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() =>
                            setActiveCategory(
                              activeCategory === cat.id ? null : cat.id,
                            )
                          }
                          className={`group flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap shadow-md border ${
                            activeCategory === cat.id
                              ? "bg-elite-burgundy text-elite-cream shadow-lg scale-105 border-elite-burgundy"
                              : cat.comingSoon
                                ? "bg-elite-dark-cream text-elite-black/50 cursor-not-allowed border-elite-dark-cream"
                                : "bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-102 border-elite-burgundy/20 hover:border-elite-burgundy"
                          }`}
                          disabled={cat.comingSoon}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              activeCategory === cat.id
                                ? "bg-elite-cream"
                                : "bg-elite-burgundy group-hover:bg-elite-cream"
                            }`}
                          ></div>
                          <span className="font-cabin font-medium text-sm">
                            {cat.name}
                          </span>
                          {cat.comingSoon && (
                            <span className="text-xs bg-elite-burgundy/40 text-elite-cream/90 px-2 py-0.5 rounded-full font-medium">
                              Soon
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 min-w-0">
                  {/* Desktop Sidebar - Hidden on Mobile */}
                  <div className="hidden lg:block lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto sidebar-scroll">
                      {/* Sidebar Header */}
                      <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
                        <h2 className="font-calistoga text-elite-burgundy text-xl font-bold mb-1">
                          Categories
                        </h2>
                        <p className="font-cabin text-elite-black/70 text-xs">
                          Explore our menu
                        </p>
                      </div>

                      {/* Categories List */}
                      <div className="space-y-1">
                        {categories.map((cat, index) => (
                          <div key={cat.id}>
                            <Link
                              href={cat.comingSoon ? "#" : `/menu/${cat.id}`}
                              className={`group sidebar-item flex items-center justify-between p-3 rounded-xl transition-all duration-300 border ${
                                cat.comingSoon
                                  ? "bg-elite-dark-cream text-elite-black/50 cursor-not-allowed border-elite-dark-cream"
                                  : "bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-102 border-elite-burgundy/20 hover:border-elite-burgundy"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                    cat.comingSoon
                                      ? "bg-elite-black/20"
                                      : "bg-elite-burgundy group-hover:bg-elite-cream"
                                  }`}
                                ></div>
                                <span className="font-cabin font-medium text-sm">
                                  {cat.name}
                                </span>
                              </div>
                              {cat.comingSoon && (
                                <span className="text-xs bg-elite-burgundy/40 text-elite-cream/90 px-2 py-0.5 rounded-full font-medium">
                                  Soon
                                </span>
                              )}
                            </Link>
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
                            Fresh ingredients daily
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="space-y-8 sm:space-y-12">
                      {categories
                        .filter(
                          (category) =>
                            !activeCategory || category.id === activeCategory,
                        )
                        .map((category, index) => (
                          <div key={category.id} className="relative">
                            <div className="bg-elite-cream rounded-2xl p-4 sm:p-6 md:p-8 w-full relative">
                              {category.comingSoon && (
                                <div className="absolute inset-0 bg-elite-cream/80 rounded-2xl z-10"></div>
                              )}

                              <div
                                className={`${category.comingSoon ? "opacity-40" : ""}`}
                              >
                                <div className="mb-6 sm:mb-8">
                                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                                    <div
                                      className={`p-2 sm:p-3 rounded-xl ${
                                        category.comingSoon
                                          ? "bg-elite-dark-cream text-elite-burgundy"
                                          : "bg-elite-burgundy text-elite-cream"
                                      }`}
                                    >
                                      {renderIcon(category.icon)}
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <h3 className="font-calistoga text-elite-black text-xl sm:text-2xl md:text-3xl font-bold">
                                        {category.name}
                                      </h3>
                                      {category.comingSoon && (
                                        <span className="bg-elite-burgundy/60 text-elite-cream/80 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-cabin font-bold">
                                          Coming Soon
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="font-cabin text-elite-black/90 text-sm sm:text-base md:text-lg">
                                    {category.description}
                                  </p>
                                </div>

                                {!category.comingSoon &&
                                  category.subCategories.length > 0 && (
                                    <div className="space-y-6 sm:space-y-8">
                                      {category.subCategories.map((sub) => (
                                        <div
                                          key={sub.id}
                                          className="space-y-3 sm:space-y-4"
                                        >
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-calistoga text-elite-black text-lg sm:text-xl md:text-2xl font-bold">
                                              {sub.name}
                                            </h4>
                                            <span className="hidden md:block text-elite-black/60 text-sm font-cabin">
                                              Scroll to see all items
                                            </span>
                                          </div>

                                          {/* Items Preview - Horizontal Scrollable on All Screens */}
                                          <div className="overflow-x-auto menu-items-scroll">
                                            <div className="flex gap-3 sm:gap-4 pb-4">
                                              {sub.items.map((item) => (
                                                <div
                                                  key={item.id}
                                                  className="w-56 sm:w-64 md:w-72 flex-shrink-0"
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
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                            {index <
                              categories.filter(
                                (cat) =>
                                  !activeCategory || cat.id === activeCategory,
                              ).length -
                                1 && (
                              <div className="h-px bg-elite-burgundy/10 mt-8 sm:mt-12"></div>
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
                <h3 className="text-elite-black font-calistoga text-2xl mb-2">No Menu Available</h3>
                <p className="text-elite-black/60 font-cabin mb-4">Our menu is being prepared. Please check back soon!</p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
