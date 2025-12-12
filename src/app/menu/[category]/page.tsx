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
import MenuPageSkeleton from "@/components/skeletons/MenuPageSkeleton";
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

      <div className="min-h-screen bg-elite-burgundy pb-20 md:pb-0 pt-16 md:pt-0">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-elite-burgundy opacity-90"></div>

          <div className="relative min-h-[30vh] md:min-h-[60vh] w-full overflow-hidden">
            <div className="absolute inset-0 z-[1]">
              <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl sm:text-9xl md:text-[12rem] lg:text-[20rem] xl:text-[24rem] font-cabin font-bold text-elite-cream select-none pointer-events-none opacity-90">
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
                    } ${animationPlayed ? "drink-overlay-animation animated" : ""}`}
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
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
            {loading && <MenuPageSkeleton />}

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
                <div className="lg:hidden mb-8">
                  <div className="overflow-x-auto scrollbar-hide -mx-6 px-6 scroll-smooth">
                    <div className="flex gap-3 py-4 min-w-max snap-x snap-mandatory">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => router.push(`/menu/${cat.id}`)}
                          className={`group flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap shadow-md border snap-start ${
                            String(cat.id) === String(categoryId)
                              ? "bg-elite-burgundy text-elite-cream shadow-lg scale-105 border-elite-burgundy"
                              : "bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-102 border-elite-burgundy/20 hover:border-elite-burgundy"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              String(cat.id) === String(categoryId)
                                ? "bg-elite-cream"
                                : "bg-elite-burgundy group-hover:bg-elite-cream"
                            }`}
                          ></div>
                          <span className="font-cabin font-medium text-sm">{cat.name}</span>
                        </button>
                      ))}
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
                      <div className="space-y-4 sm:space-y-6">
                        {displayedCategories.map((category, index) => (
                          <div key={category.id} className="relative">
                            <div className="bg-elite-cream rounded-2xl p-5 sm:p-6 lg:p-8 w-full relative">
                              <div>
                                <div className="mb-4 sm:mb-6">
                                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                                    <div className="p-3 sm:p-4 rounded-xl bg-elite-burgundy text-elite-cream">
                                      {renderIcon(category.icon)}
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <h3 className="font-calistoga text-elite-black text-2xl sm:text-3xl md:text-4xl font-bold">
                                        {category.name}
                                      </h3>
                                    </div>
                                  </div>
                                  {category.description && (
                                    <p className="font-cabin text-elite-black/60">{category.description}</p>
                                  )}
                                </div>

                                {category.subCategories.length > 0 && (
                                  <div className="space-y-6 sm:space-y-8">
                                    {category.subCategories.map((sub) => (
                                      <div key={sub.id} className="space-y-3 sm:space-y-4">
                                        <div className="overflow-x-auto menu-items-scroll scrollbar-hide -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8 py-4">
                                          <div className="flex gap-5 sm:gap-6 pb-4">
                                            {sub.items
                                              .filter((item) => item !== null && item !== undefined)
                                              .map((item) => (
                                                <div
                                                  key={item.id}
                                                  className="w-64 sm:w-72 md:w-80 lg:w-96 flex-shrink-0 snap-start"
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
                                                    onQuickAdd={() => {
                                                      const product = (apiProducts || []).find((p) => p.id === item.id);
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
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {index < displayedCategories.length - 1 && (
                              <div className="h-px bg-elite-burgundy/10 mt-4 sm:mt-6"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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
