"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { getCategoryById, getAllCategories } from "@/lib/menuData";
import { MenuItem } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Utensils,
  Home,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DrinkCard from "@/components/DrinkCard";
import CategoryPageSkeleton from "@/components/skeletons/CategoryPageSkeleton";
import { useState } from "react";
import ProductModal from "@/components/menu/ProductModal";
import { Product } from "@/hooks/useProducts";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params?.category as string;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch categories and products from API
  const { categories: allCategories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories, getCategoryById: getApiCategory } = useCategories();
  const { products: categoryProducts, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({ categoryId });

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;
  
  // Use fallback when cache is empty
  const USE_FALLBACK = error?.includes("503") || error?.includes("cache is empty");
  
  const category = USE_FALLBACK ? getCategoryById(categoryId) : getApiCategory(categoryId);
  const allCats = USE_FALLBACK ? getAllCategories() : allCategories;

  // Memoize products to prevent dependency issues
  const products = useMemo(() => {
    return USE_FALLBACK ? (getCategoryById(categoryId)?.subCategories.flatMap(sub => sub.items) || []) : categoryProducts;
  }, [USE_FALLBACK, categoryId, categoryProducts]);

  // Group products into subcategories (for now, just use one subcategory per category)
  const subCategories = useMemo(() => {
    if (USE_FALLBACK && category) {
      return category.subCategories;
    }
    
    if (!products.length || !category) return [];
    
    return [{
      id: category.id,
      name: category.name,
      description: category.description || `Explore our ${category.name} selection`,
      items: products.map((p: { id: string; name: string; description?: string; price: number; image?: string; images?: string[] }) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: p.price,
        images: p.image ? [p.image] : p.images || ["/images/placeholder.svg"],
      }))
    }];
  }, [products, category, USE_FALLBACK]);

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName?.toLowerCase()) {
      case "drinks":
        return <Coffee className="w-5 h-5" />;
      case "food":
        return <Utensils className="w-5 h-5" />;
      case "at home coffee":
        return <Home className="w-5 h-5" />;
      default:
        return <Coffee className="w-5 h-5" />;
    }
  };

  const handleQuickAdd = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Loading State
  if (loading) {
    return (
      <main>
        <Navigation />
        <CategoryPageSkeleton />
        <Footer />
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <main>
        <Navigation />
        <div className="min-h-screen bg-elite-cream flex items-center justify-center px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-red-900 font-calistoga text-xl mb-2">Unable to Load Category</h3>
            <p className="text-red-700 font-cabin mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-white text-elite-burgundy px-6 py-3 rounded-full font-cabin font-semibold hover:bg-gray-50 transition-all border border-elite-burgundy"
              >
                ← Back to Menu
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Category Not Found
  if (!category) {
    return (
      <main>
        <Navigation />
        <div className="min-h-screen bg-elite-cream flex items-center justify-center px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
            <Coffee className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-amber-900 font-calistoga text-xl mb-2">Category Not Found</h3>
            <p className="text-amber-700 font-cabin mb-4">We couldn't find the category you're looking for.</p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Menu
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-8">
          <div className="max-w-7xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 text-sm mb-4">
              <Link
                href="/menu"
                className="hover:text-elite-light-cream transition-colors duration-200"
              >
                Menu
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold">{category.name}</span>
            </div>

            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">{getCategoryIcon(category.name)}</div>
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                  {category.name}
                </h1>
                <p className="font-cabin text-elite-cream/90 text-lg">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Back to Menu Button */}
            <Link
              href="/menu"
              className="inline-flex items-center gap-3 bg-elite-cream text-elite-burgundy px-6 py-3 rounded-full font-cabin font-semibold transition-all duration-300 hover:bg-elite-light-cream hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Menu
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto sidebar-scroll">
                {/* Sidebar Header */}
                <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
                  <h2 className="font-calistoga text-elite-burgundy text-xl font-bold mb-1">
                    Menu
                  </h2>
                  <p className="font-cabin text-elite-black/70 text-xs">
                    Browse our categories
                  </p>
                </div>

                {/* Main Menu */}
                <div className="space-y-2 mb-6">
                  {allCats.map((cat, index) => (
                    <div key={cat.id}>
                      <Link
                        href={`/menu/${cat.id}`}
                        className={`group sidebar-item flex items-center justify-between p-3 rounded-xl transition-all duration-300 border ${
                          cat.id === categoryId
                            ? "bg-elite-burgundy text-elite-cream shadow-lg border-elite-burgundy"
                            : "bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105 border-elite-burgundy/20 hover:border-elite-burgundy"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              cat.id === categoryId
                                ? "bg-elite-cream"
                                : "bg-elite-burgundy group-hover:bg-elite-cream"
                            }`}
                          ></div>
                          <span className="font-cabin font-semibold text-sm">
                            {cat.name}
                          </span>
                        </div>
                      </Link>
                      {index < allCategories.length - 1 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-elite-burgundy/20 to-transparent my-4"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Sidebar Footer */}
                <div className="pt-4 border-t border-elite-burgundy/20">
                  <div className="text-center">
                    <p className="font-cabin text-elite-black/40 text-xs">
                      Fresh ingredients daily
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Content */}
            <div className="flex-1">
              {/* Empty Category State */}
              {products.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Coffee className="w-16 h-16 text-elite-burgundy/40 mb-4" />
                  <h3 className="text-elite-black font-calistoga text-2xl mb-2">No Products Available</h3>
                  <p className="text-elite-black/60 font-cabin mb-4">This category is being stocked. Check back soon!</p>
                </div>
              )}

              {/* Subcategories with Items */}
              {products.length > 0 && (
                <div className="space-y-12">
                  {subCategories.map((sub, index) => (
                    <div key={sub.id} className="relative">
                      <div className="bg-elite-cream rounded-2xl shadow-md p-8 border border-elite-burgundy/10">
                        
                        {/* Items List - Enhanced Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                          {sub.items.map((item) => (
                            <DrinkCard
                              key={item.id}
                              images={item.images}
                              name={item.name}
                              price={item.price}
                              description={item.description}
                              size="medium"
                              href={`/products/${item.id}`}
                              menuItemId={item.id}
                              showAddToOrder={true}
                              onQuickAdd={() => {
                                if (USE_FALLBACK) {
                                  // Map MenuItem to Product structure for fallback data
                                  const menuItem = item as MenuItem; 
                                  const mappedProduct: Product = {
                                    id: menuItem.id,
                                    name: menuItem.name,
                                    description: menuItem.description,
                                    price: menuItem.price,
                                    images: menuItem.images,
                                    attributes: {}
                                  };
                                  
                                  // Map sizes to attributes
                                  if (menuItem.sizes && menuItem.sizes.length > 0) {
                                    mappedProduct.attributes = mappedProduct.attributes || {};
                                    mappedProduct.attributes["Size"] = menuItem.sizes.map((s, idx) => ({
                                      id: idx,
                                      name: s.name,
                                      priceExtra: s.priceModifier
                                    }));
                                  }
                                  
                                  setSelectedProduct(mappedProduct);
                                } else {
                                  const product = categoryProducts.find(p => p.id === item.id);
                                  if (product) {
                                    setSelectedProduct(product);
                                  }
                                }
                                setIsModalOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {index < subCategories.length - 1 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-elite-burgundy/20 to-transparent mt-12"></div>
                      )}
                    </div>
                  ))}
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
      
      <Footer />
    </main>
  );
}
