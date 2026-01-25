"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  TrendingUp,
  ShoppingCart,
  Check,
} from "lucide-react";
import Image from "next/image";
import AttributeSelector from "./AttributeSelector";
import QuantitySelector from "./QuantitySelector";
import { useLocalCart, type LocalCartItem } from "@/hooks/useLocalCart";
import { useToast } from "@/components/ToastProvider";
import DrinkCard from "@/components/DrinkCard";
import { ReviewCard } from "@/components/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import { getLocalProductImageCandidates } from "@/lib/imageUtils";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";

interface AttributeValue {
  id: number;
  name: string;
  priceExtra: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  images: string[];
  available: boolean;
  stock: number | null;
  sequence: number;
  uom?: { id: number; name: string };
  taxes?: number[];
  category?: { id: string; name: string };
  attributes?: Record<string, AttributeValue[]>;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, number | number[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useLocalCart();
  const { error: toastError, success: toastSuccess } = useToast();
  const t = useTranslations("productDetail");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  // Fetch reviews for this product
  const {
    reviews,
    stats,
    loading: reviewsLoading,
  } = useReviews({
    productId: product.id,
  });

  // Detect multi-select attributes
  const isMultiSelect = (attributeName: string): boolean => {
    const multiSelectKeywords = [
      "topping",
      "toppings",
      "extra",
      "extras",
      "sauce",
      "sauces",
      "vegetable",
      "vegetables",
      "ingredient",
      "ingredients",
      "addition",
      "additions",
      "protein",
      "cheese",
      "bread",
    ];
    const lower = attributeName.toLowerCase();
    return multiSelectKeywords.some((keyword) => lower.includes(keyword));
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    let total = product.price;

    if (product.attributes) {
      Object.entries(selectedAttributes).forEach(([attrName, selected]) => {
        const attribute = product.attributes?.[attrName];
        if (!attribute) return;

        if (Array.isArray(selected)) {
          // Multi-select: sum all selected
          selected.forEach((valueId) => {
            const value = attribute.find((v) => v.id === valueId);
            if (value) total += value.priceExtra;
          });
        } else {
          // Single-select: add priceExtra
          const value = attribute.find((v) => v.id === selected);
          if (value) total += value.priceExtra;
        }
      });
    }

    return total * quantity;
  };

  // Validate selections (check required attributes)
  const validateSelections = (): { valid: boolean; message?: string } => {
    if (!product.attributes) return { valid: true };

    // Size is typically required if present
    const hasSize = product.attributes["Size"];
    if (hasSize && !selectedAttributes["Size"]) {
      return { valid: false, message: t("validation.selectSize") };
    }

    return { valid: true };
  };

  // Handle add to cart
  const handleAddToCart = () => {
    const validation = validateSelections();

    if (!validation.valid) {
      toastError(validation.message || t("validation.selectAllRequired"));
      return;
    }

    // Transform selected attributes to cart format
    const cartAttributes: LocalCartItem["attributes"] = {};

    if (product.attributes) {
      Object.entries(selectedAttributes).forEach(([attrName, selected]) => {
        const attribute = product.attributes?.[attrName];
        if (!attribute) return;

        if (Array.isArray(selected)) {
          // Multi-select
          cartAttributes[attrName] = selected
            .map((valueId) => {
              const value = attribute.find((v) => v.id === valueId);
              return {
                valueId,
                valueName: value?.name || "",
                priceExtra: value?.priceExtra || 0,
              };
            })
            .filter((v) => v.valueName);
        } else {
          // Single-select
          const value = attribute.find((v) => v.id === selected);
          if (value) {
            cartAttributes[attrName] = [
              {
                valueId: value.id,
                valueName: value.name,
                priceExtra: value.priceExtra,
              },
            ];
          }
        }
      });
    }

    // Calculate unit price (price for 1 item with selected attributes)
    const unitPrice = Object.values(cartAttributes).reduce((sum, values) => {
      return sum + values.reduce((s, v) => s + v.priceExtra, 0);
    }, product.price);

    // Add to cart
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity,
      attributes: cartAttributes,
      totalPrice: unitPrice * quantity,
      image: getLocalProductImageCandidates(product.name)[0] || product.images?.[0],
    });

    // Show success feedback
    setAddedToCart(true);
    toastSuccess(t("toast.addedToCart", { name: product.name }));
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const nextImage = () => {
    if (product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const prevImage = () => {
    if (product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1,
      );
    }
  };

  // Fallback image if no images available
  const displayImages =
    product.images.length > 0
      ? product.images
      : ["/images/placeholder-product.jpg"];

  const hasImages = product.images.length > 0;
  const hasMultipleImages = product.images.length > 1;

  // Render component
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Hidden on mobile (using MobileHeader) */}
      <div className="hidden md:block bg-elite-burgundy text-elite-cream py-6 pb-14">
        <div className="max-w-7xl mx-auto px-6">
          <LocalizedLink
            href="/menu"
            className="inline-flex items-center gap-2 bg-elite-cream/20 text-elite-cream px-4 py-2 rounded-full font-cabin font-medium transition-all duration-300 hover:bg-elite-cream/30"
          >
            <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
            {t("actions.backToMenu")}
          </LocalizedLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-elite-cream md:rounded-t-[2.5rem] md:-mt-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
            {/* Image Section - Compact on mobile */}
            <div className="relative lg:sticky lg:top-32 h-fit">
              <div className="aspect-square bg-gradient-to-b from-elite-cream to-elite-burgundy/5 relative rounded-3xl overflow-hidden">
                {/* Main Image Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {hasImages ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={displayImages[currentImageIndex]}
                        alt={product.name}
                        fill
                        className="object-contain p-4 md:p-8"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-elite-burgundy/40">
                      <Package className="w-16 h-16 md:w-24 md:h-24 mb-3" />
                      <p className="font-cabin text-xs md:text-sm">
                        {t("images.noImage")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stock Badge - Compact on mobile */}
                <div className="absolute top-3 right-3 md:top-6 md:right-6 z-10">
                  {product.available ? (
                    <div className="bg-elite-burgundy text-elite-cream px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-cabin font-bold shadow-md flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-elite-cream rounded-full animate-pulse" />
                      {t("stock.inStock")}
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-cabin font-bold shadow-md">
                      {t("stock.soldOut")}
                    </div>
                  )}
                </div>

                {/* Image Navigation - Touch friendly */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg z-20 touch-manipulation"
                      aria-label={t("images.previous")}
                    >
                      <ChevronLeft
                        className={cn(
                          "w-5 h-5 md:w-6 md:h-6",
                          isRTL && "rotate-180",
                        )}
                      />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg z-20 touch-manipulation"
                      aria-label={t("images.next")}
                    >
                      <ChevronRight
                        className={cn(
                          "w-5 h-5 md:w-6 md:h-6",
                          isRTL && "rotate-180",
                        )}
                      />
                    </button>
                  </>
                )}

                {/* Image Indicators - Smaller on mobile */}
                {hasMultipleImages && (
                  <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 touch-manipulation ${
                          index === currentImageIndex
                            ? "bg-elite-burgundy scale-125"
                            : "bg-elite-burgundy/40"
                        }`}
                        aria-label={t("images.viewImage", { number: index + 1 })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery - Hidden on mobile for cleaner UX */}
              {hasMultipleImages && (
                <div className="hidden md:grid mt-4 grid-cols-4 gap-3">
                  {product.images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-elite-burgundy shadow-lg"
                          : "border-elite-burgundy/20 hover:border-elite-burgundy/50"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={t("images.thumbnailAlt", {
                          name: product.name,
                          number: index + 1,
                        })}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information - Compact mobile layout */}
            <div className="space-y-5 md:space-y-8">
              {/* Header Section */}
              <div className="space-y-2 md:space-y-4">
                {product.category && (
                  <LocalizedLink
                    href={`/menu?category=${product.category.id}`}
                    className="inline-flex items-center gap-1 text-elite-burgundy/60 active:text-elite-burgundy font-cabin text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors touch-manipulation"
                  >
                    {product.category.name}
                  </LocalizedLink>
                )}

                <h1 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  {product.name}
                </h1>

                {/* Description */}
                {product.description && (
                  <p className="font-cabin text-elite-black/60 text-sm md:text-base leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Base Price */}
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-calistoga text-elite-burgundy text-2xl md:text-3xl">
                    {formatPrice(product.price)}
                  </span>
                  {product.attributes &&
                    Object.keys(product.attributes).length > 0 && (
                      <span className="font-cabin text-elite-black/40 text-xs md:text-sm">
                        {t("price.starting")}
                      </span>
                    )}
                </div>
              </div>

              <div className="h-px bg-elite-burgundy/10 w-full" />

              {/* Configuration Section */}
              <div className="space-y-5 md:space-y-8">
                {/* Attributes */}
                {product.attributes &&
                  Object.keys(product.attributes).length > 0 && (
                    <div className="space-y-4 md:space-y-6">
                      {Object.entries(product.attributes).map(
                        ([attributeName, values]) => (
                          <AttributeSelector
                            key={attributeName}
                            label={attributeName}
                            values={values}
                            selected={selectedAttributes[attributeName]}
                            multiSelect={isMultiSelect(attributeName)}
                            onChange={(selected) =>
                              setSelectedAttributes((prev) => ({
                                ...prev,
                                [attributeName]: selected,
                              }))
                            }
                            required={attributeName === "Size"}
                          />
                        ),
                      )}
                      <div className="h-px bg-elite-black/5 w-full" />
                    </div>
                  )}

                {/* Quantity & Total - Compact row on mobile */}
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <QuantitySelector
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                      max={50}
                      disabled={!product.available}
                    />

                    <div className="text-right">
                      <p className="font-cabin text-xs md:text-sm text-elite-black/50">
                        {t("price.total")}
                      </p>
                      <p className="font-calistoga text-xl md:text-3xl text-elite-burgundy">
                        {formatPrice(calculateTotalPrice())}
                      </p>
                    </div>
                  </div>

                  {/* Add to Cart Button - Rounded pill style with optimistic feedback */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.available || addedToCart}
                    className={cn(
                      "w-full py-4 md:py-5 rounded-2xl md:rounded-3xl font-cabin font-bold text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.97] touch-manipulation",
                      !product.available
                        ? "bg-elite-black/10 text-elite-black/40 cursor-not-allowed"
                        : addedToCart
                          ? "bg-emerald-500 text-white shadow-emerald-500/30"
                          : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/30 hover:shadow-2xl",
                    )}
                  >
                    {!product.available ? (
                      t("stock.soldOut")
                    ) : addedToCart ? (
                      <>
                        <Check className="w-5 h-5 animate-bounce" />
                        {t("actions.added")}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {t("actions.addToCart")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 sm:mt-12 lg:mt-16 bg-elite-cream rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/10 p-4 sm:p-6 lg:p-8 xl:p-10 w-full">
            <div className="mb-6 sm:mb-8">
              <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 flex-col sm:flex-row gap-4">
                <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {t("reviews.title")}
                </h2>
                {stats && stats.total > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-full border-2 border-elite-burgundy/20 shadow-md">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                            star <= Math.round(stats.averageRating)
                              ? "fill-elite-burgundy text-elite-burgundy"
                              : "text-elite-burgundy/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-cabin text-elite-burgundy font-bold text-base sm:text-lg lg:text-xl">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="font-cabin text-elite-black/60 text-xs sm:text-sm font-medium">
                      {t("reviews.count", { count: stats.total })}
                    </span>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <h3 className="font-calistoga text-elite-black text-lg sm:text-xl lg:text-2xl mb-3 sm:mb-4">
                  {reviews.length > 0
                    ? t("reviews.all", { count: reviews.length })
                    : t("reviews.header")}
                </h3>
                {reviewsLoading ? (
                  <div className="text-center py-16 bg-white rounded-3xl border-2 border-elite-burgundy/10">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-elite-burgundy border-t-transparent mx-auto"></div>
                    <p className="mt-6 font-cabin text-elite-burgundy font-semibold text-lg">
                      {t("reviews.loading")}
                    </p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border-2 border-elite-burgundy/10 shadow-md">
                    <div className="w-20 h-20 rounded-full bg-elite-burgundy/10 flex items-center justify-center mx-auto mb-6">
                      <Star className="w-10 h-10 text-elite-burgundy" />
                    </div>
                    <h4 className="font-calistoga text-elite-black text-2xl mb-3">
                      {t("reviews.empty.title")}
                    </h4>
                    <p className="font-cabin text-elite-black/60 text-base">
                      {t("reviews.empty.description")}
                    </p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 sm:mt-12 lg:mt-16">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl font-bold mb-2">
                  {t("related.title")}
                </h2>
                <p className="font-cabin text-elite-black/60 text-sm sm:text-base">
                  {t("related.subtitle", {
                    category: product.category?.name || t("related.thisCategory"),
                  })}
                </p>
              </div>

              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 px-1 -mx-4 snap-x snap-mandatory scrollbar-hide">
                  {relatedProducts.map((relatedProduct) => (
                    <div
                      key={relatedProduct.id}
                      className="flex-shrink-0 w-[280px] snap-start"
                    >
                      <DrinkCard
                        id={relatedProduct.id}
                        name={relatedProduct.name}
                        price={relatedProduct.price}
                        images={relatedProduct.images}
                        available={relatedProduct.available}
                        href={`/products/${relatedProduct.id}`}
                        menuItemId={relatedProduct.id}
                        showAddToOrder={true}
                        className="h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {relatedProducts.map((relatedProduct) => (
                  <DrinkCard
                    key={relatedProduct.id}
                    id={relatedProduct.id}
                    name={relatedProduct.name}
                    price={relatedProduct.price}
                    images={relatedProduct.images}
                    available={relatedProduct.available}
                    href={`/products/${relatedProduct.id}`}
                    menuItemId={relatedProduct.id}
                    showAddToOrder={true}
                    className="h-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
