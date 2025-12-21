"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useProducts, Product } from "@/hooks/useProducts";
import { sanitizeImages } from "@/lib/imageUtils";
import {
  getAllCategories,
  MenuCategory as FallbackMenuCategory,
  MenuItem as FallbackMenuItem,
} from "@/lib/menuData";
import { Coffee, Sparkles, Heart, Utensils, Home, RefreshCw } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import SwipeIndicator from "@/components/SwipeIndicator";
import Footer from "@/components/Footer";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import DrinkCard from "@/components/DrinkCard";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CategoryPageSkeleton from "@/components/skeletons/CategoryPageSkeleton";
import ProductModal from "@/components/menu/ProductModal";

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
  const router = useRouter();
  const categoryId = params?.category as string;

  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
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
  } = useProducts();

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;
  const USE_FALLBACK = error?.includes("503") || error?.includes("cache is empty");

  const handleRetry = () => {
    refetchCategories();
    refetchProducts();
  };

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

  useEffect(() => {
    heroImages.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [heroImages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const categories: MenuCategory[] = useMemo(() => {
    if (USE_FALLBACK) {
      const fallbackCategories: FallbackMenuCategory[] = getAllCategories();

      return fallbackCategories
        .filter((cat) => {
          const categoryName = (cat.name || "").toLowerCase();
          return !categoryName.includes("offer");
        })
        .reduce<MenuCategory[]>((acc, cat) => {
          const items: FallbackMenuItem[] = cat.subCategories.flatMap((s) => s.items);
          if (!cat.id || items.length === 0) return acc;

          acc.push({
            id: String(cat.id),
            name: cat.name || "Unknown Category",
            description: cat.description || "Explore our selection",
            icon: cat.icon || "coffee",
            comingSoon: false,
            subCategories: [
              {
                id: String(cat.id),
                name: cat.name || "Unknown Category",
                items: items.map((p) => ({
                  id: String(p.id),
                  name: p.name || "Unnamed Product",
                  description: p.description || "",
                  price: typeof p.price === "number" ? p.price : 0,
                  images: p.images.length > 0 ? p.images : ["/images/placeholder.svg"],
                  available: p.available !== false,
                })),
              },
            ],
          });

          return acc;
        }, []);
    }

    if (!apiCategories || !Array.isArray(apiCategories) || apiCategories.length === 0) {
      return [];
    }

    return apiCategories
      .filter((cat) => {
        const categoryName = cat?.name?.toLowerCase() || "";
        return !categoryName.includes("offer");
      })
      .reduce<MenuCategory[]>((acc, cat) => {
        if (!cat?.id) return acc;

        const categoryProducts = (apiProducts || []).filter((p) => p?.categoryId === cat.id);
        if (categoryProducts.length === 0) return acc;

        const items = categoryProducts.flatMap((p) => {
          if (!p?.id) return [];
          return [
            {
              id: p.id,
              name: p.name || "Unnamed Product",
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
          name: cat.name || "Unknown Category",
          description: cat.description || "Explore our selection",
          icon: "coffee",
          comingSoon: false,
          subCategories: [
            {
              id: cat.id,
              name: cat.name || "Unknown Category",
              items,
            },
          ],
        });

        return acc;
      }, []);
  }, [USE_FALLBACK, apiCategories, apiProducts]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === String(categoryId)) || null;
  }, [categories, categoryId]);

  const displayedCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return [selectedCategory];
  }, [selectedCategory]);

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block"></div>
      <MobileHeader title="Menu" showBack={true} transparent={true} />

      {/* Full-height background */}
      <div className="min-h-screen bg-elite-burgundy pb-24 md:pb-0">
        {/* Hero Section - Large and attractive design */}
        <div className="relative pt-14 md:pt-0">
          <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh] w-full overflow-hidden">
            {/* Background text */}
            <div className="absolute inset-0 z-[1] flex items-center justify-center">
              <h1 className="text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[18rem] xl:text-[22rem] font-cabin font-bold text-elite-cream/90 select-none pointer-events-none tracking-tight leading-none">
                {selectedCategory?.name?.toUpperCase() || "MENU"}
              </h1>
            </div>

            {/* Hero Images Container - Bottom-aligned to prevent layout shift */}
            <div className="absolute inset-0 z-[5] flex items-end justify-center pb-0">
              <div className="relative w-full h-full flex items-end justify-center hero-image-container">
                {heroImages.map((imageSrc, index) => (
                  <div
                    key={imageSrc}
                    className={`absolute inset-0 flex items-end justify-center transition-opacity duration-700 ease-in-out ${
                      index === currentHeroImage ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={imageSrc}
                      alt={`Hero Image ${index + 1}`}
                      className={`w-[20rem] h-[20rem] sm:w-[28rem] sm:h-[28rem] md:w-[38rem] md:h-[38rem] lg:w-[48rem] lg:h-[48rem] xl:w-[56rem] xl:h-[56rem] object-contain pointer-events-none ${
                        animationPlayed ? "drink-overlay-animation animated" : ""
                      }`}
                      style={{
                        objectPosition: "bottom center",
                        maxHeight: "90%",
                      }}
                      aria-hidden={index !== currentHeroImage}
                      loading="eager"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Outlined text */}
            <div className="absolute inset-0 z-[10] flex items-center justify-center pointer-events-none">
              <h1
                className="text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[18rem] xl:text-[22rem] font-cabin font-bold select-none tracking-tight leading-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px rgba(248, 240, 210, 0.6)",
                }}
              >
                {selectedCategory?.name?.toUpperCase() || "MENU"}
              </h1>
            </div>
          </div>
        </div>

        {/* Content with curved top */}
        <div className="relative z-20 -mt-5 md:-mt-8">
          <div className="absolute top-0 left-0 right-0 h-6 md:h-10 bg-elite-cream rounded-t-[1.75rem] md:rounded-t-[2.5rem]" />
          
          <div className="relative bg-elite-cream pt-3 md:pt-6 min-h-[65vh]">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12">
            {loading && <CategoryPageSkeleton />}

            {error && !loading && (
              <ErrorState error={error} onRetry={handleRetry} size="large" />
            )}

            {!loading && !error && (categoriesEmpty || categories.length === 0) && (
              <EmptyState
                variant="no-products"
                title="Catalog Not Synced"
                description="The product catalog needs to be synchronized from Odoo. Please contact an administrator or try refreshing."
                actionLabel="Refresh"
                onAction={handleRetry}
              />
            )}

            {!loading && !error && categories.length > 0 && (
              <>
                {/* Mobile Category Pills - Sticky with polished design */}
                <div className="lg:hidden sticky top-16 z-30 -mx-6 px-4 mb-5 pt-2 pb-3 bg-elite-cream/90 backdrop-blur-sm border-b border-elite-burgundy/5">
                  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
                    <div className="flex gap-2.5 min-w-max snap-x snap-mandatory py-1">
                      {categories.map((cat) => {
                        const isActive = String(cat.id) === String(categoryId);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => router.push(`/menu/${cat.id}`)}
                            className={`group flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap touch-manipulation active:scale-95 snap-start ${
                              isActive
                                ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20"
                                : "bg-white text-elite-black/80 border border-elite-burgundy/15 active:bg-elite-burgundy/5"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                isActive ? "bg-elite-cream" : "bg-elite-burgundy/60"
                              }`}
                            />
                            <span className={`font-cabin text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 min-w-0">
                  <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto sidebar-scroll">
                      <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
                        <h2 className="font-calistoga text-elite-burgundy text-2xl font-bold mb-2">Categories</h2>
                        <p className="font-cabin text-elite-black/70 text-sm">Explore our menu</p>
                      </div>

                      <div className="space-y-1">
                        {categories.map((cat, index) => (
                          <div key={cat.id}>
                            <Link
                              href={`/menu/${cat.id}`}
                              className={`group sidebar-item flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
                                String(cat.id) === String(categoryId)
                                  ? "bg-elite-burgundy text-elite-cream shadow-lg border-elite-burgundy"
                                  : "bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-102 border-elite-burgundy/20 hover:border-elite-burgundy"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    String(cat.id) === String(categoryId)
                                      ? "bg-elite-cream"
                                      : "bg-elite-burgundy group-hover:bg-elite-cream"
                                  }`}
                                ></div>
                                <span className="font-cabin font-semibold text-base">{cat.name}</span>
                              </div>
                            </Link>
                            {index < categories.length - 1 && (
                              <div className="h-px bg-elite-burgundy/10 my-3"></div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-elite-burgundy/20">
                        <div className="text-center">
                          <p className="font-cabin text-elite-black/40 text-xs">Fresh ingredients daily</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {!selectedCategory && (
                      <EmptyState
                        variant="no-products"
                        title="Category Not Found"
                        description="We couldn't find the category you're looking for."
                        actionLabel="Back to Menu"
                        onAction={() => router.push("/menu")}
                      />
                    )}

                    {selectedCategory && displayedCategories.length > 0 && (
                      <>
                        {displayedCategories.map((category) => (
                          <div key={category.id}>
                            {/* Mobile: Category header with item count */}
                            <div className="lg:hidden mb-4 px-1">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-elite-burgundy text-elite-cream flex items-center justify-center shadow-md shadow-elite-burgundy/20">
                                  {renderIcon(category.icon)}
                                </div>
                                <div>
                                  <h2 className="font-calistoga text-elite-black text-xl font-bold leading-tight">
                                    {category.name}
                                  </h2>
                                  <p className="font-cabin text-elite-black/50 text-xs">
                                    {category.subCategories[0]?.items.length || 0} items available
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Desktop: Full header */}
                            <div className="hidden lg:block mb-6">
                              <div className="flex items-center gap-4 mb-2">
                                <div className="p-4 rounded-xl bg-elite-burgundy text-elite-cream">
                                  {renderIcon(category.icon)}
                                </div>
                                <div>
                                  <h2 className="font-calistoga text-elite-black text-3xl font-bold">
                                    {category.name}
                                  </h2>
                                  {category.description && (
                                    <p className="font-cabin text-elite-black/60 mt-1">{category.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Products Grid */}
                            {category.subCategories.length > 0 && (
                              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
                                {category.subCategories[0]?.items
                                  .filter((item) => item !== null && item !== undefined)
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
                                      categoryId={category.id}
                                      animationDelay={itemIndex * 40}
                                      onQuickAdd={() => {
                                        const product = (apiProducts || []).find((p) => p.id === item.id);
                                        if (product) {
                                          setSelectedProduct(product);
                                          setIsModalOpen(true);
                                        }
                                      }}
                                    />
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
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
