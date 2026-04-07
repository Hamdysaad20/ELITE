"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  ShoppingCart,
  Check,
  AlertCircle,
  ArrowLeft,
  Minus,
  Plus,
} from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import AttributeSelector from "./AttributeSelector";
import { useLocalCart, type LocalCartItem } from "@/hooks/useLocalCart";
import { useToast } from "@/components/ToastProvider";
import DrinkCard from "@/components/DrinkCard";
import { ReviewCard } from "@/components/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import {
  getFallbackImage,
  getLocalProductImageCandidates,
  sanitizeImages,
} from "@/lib/imageUtils";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { useOrdering } from "@/context/OrderingContext";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";
import { openSupportMessenger } from "@/lib/support";

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
  onBack?: () => void;
}

export default function ProductDetailClient({
  product,
  relatedProducts,
  onBack,
}: ProductDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, number | number[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useLocalCart();
  const {
    error: toastError,
    success: toastSuccess,
    info: toastInfo,
  } = useToast();
  const t = useTranslations("productDetail");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { orderingEnabled, orderingMessage } = useOrdering();
  const disabledMessage = orderingMessage || ORDERING_DISABLED_MESSAGE;

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  const {
    reviews,
    stats,
    loading: reviewsLoading,
  } = useReviews({
    productId: product.id,
  });

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

  const calculateTotalPrice = (): number => {
    let total = product.price;
    if (product.attributes) {
      Object.entries(selectedAttributes).forEach(([attrName, selected]) => {
        const attribute = product.attributes?.[attrName];
        if (!attribute) return;
        if (Array.isArray(selected)) {
          selected.forEach((valueId) => {
            const value = attribute.find((v) => v.id === valueId);
            if (value) total += value.priceExtra;
          });
        } else {
          const value = attribute.find((v) => v.id === selected);
          if (value) total += value.priceExtra;
        }
      });
    }
    return total * quantity;
  };

  const validateSelections = (): { valid: boolean; message?: string } => {
    if (!product.attributes) return { valid: true };
    const hasSize = product.attributes["Size"];
    if (hasSize && !selectedAttributes["Size"]) {
      return { valid: false, message: t("validation.selectSize") };
    }
    return { valid: true };
  };

  const handleAddToCart = () => {
    const validation = validateSelections();
    if (!validation.valid) {
      toastError(validation.message || t("validation.selectAllRequired"));
      return;
    }

    if (!orderingEnabled) {
      openSupportMessenger();
      toastInfo(disabledMessage);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      return;
    }

    const cartAttributes: LocalCartItem["attributes"] = {};
    if (product.attributes) {
      Object.entries(selectedAttributes).forEach(([attrName, selected]) => {
        const attribute = product.attributes?.[attrName];
        if (!attribute) return;
        if (Array.isArray(selected)) {
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

    const unitPrice = Object.values(cartAttributes).reduce((sum, values) => {
      return sum + values.reduce((s, v) => s + v.priceExtra, 0);
    }, product.price);

    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity,
      attributes: cartAttributes,
      totalPrice: unitPrice * quantity,
      image:
        getLocalProductImageCandidates(product.name)[0] || product.images?.[0],
    });

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

  const displayImages = sanitizeImages([
    ...getLocalProductImageCandidates(product.name),
    ...(product.images || []),
  ]);

  const hasImages = displayImages.length > 0;
  const hasMultipleImages = displayImages.length > 1;
  const selectedImageCandidates = hasImages
    ? [
        displayImages[currentImageIndex],
        ...displayImages.filter((_, i) => i !== currentImageIndex),
      ]
    : [];

  const totalPrice = calculateTotalPrice();

  /* ─────────────────────────────────────────────── */
  /*  RENDER                                         */
  /* ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-elite-cream via-[#f8f0e4] to-[#f3e6d8]">
      {/* ═══════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* ── Hero image with gradient overlay ── */}
        <div
          className="relative overflow-hidden bg-elite-burgundy"
          style={{ height: "min(58vh, 480px)", minHeight: "300px" }}
        >
          {/* Product image */}
          {hasImages ? (
            <div className="absolute inset-0">
              <ImageWithFallback
                src={selectedImageCandidates}
                alt={product.name}
                fill
                className="object-cover"
                objectFit="cover"
                priority
                quality={90}
                showErrorIcon={false}
                fallbackSrc={getFallbackImage("product")}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-elite-burgundy/10">
              <Package className="w-20 h-20 text-elite-cream/40" />
            </div>
          )}

          {/* Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Floating back button */}
          <button
            onClick={onBack}
            className="absolute z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/25 shadow-lg active:scale-95 transition-transform"
            style={{
              top: "calc(max(env(safe-area-inset-top), 8px) + 12px)",
              insetInlineStart: "16px",
            }}
            aria-label={t("actions.backToMenu")}
          >
            <ArrowLeft
              className={cn("w-5 h-5 text-white", isRTL && "rotate-180")}
              strokeWidth={2.5}
            />
          </button>

          {/* Stock badge */}
          <div
            className="absolute z-20"
            style={{
              top: "calc(max(env(safe-area-inset-top), 8px) + 12px)",
              insetInlineEnd: "16px",
            }}
          >
            {product.available ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-cabin font-bold shadow-md">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                {t("stock.inStock")}
              </div>
            ) : (
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-cabin font-bold shadow-md">
                {t("stock.soldOut")}
              </div>
            )}
          </div>

          {/* Image navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center active:scale-95 transition-transform z-20 touch-manipulation"
                aria-label={t("images.previous")}
              >
                <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
              </button>
              <button
                onClick={nextImage}
                className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center active:scale-95 transition-transform z-20 touch-manipulation"
                aria-label={t("images.next")}
              >
                <ChevronRight
                  className={cn("w-5 h-5", isRTL && "rotate-180")}
                />
              </button>
            </>
          )}

          {/* Image dots */}
          {hasMultipleImages && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`rounded-full transition-all duration-200 touch-manipulation ${
                    index === currentImageIndex
                      ? "w-5 h-2 bg-white"
                      : "w-2 h-2 bg-white/50"
                  }`}
                  aria-label={t("images.viewImage", { number: index + 1 })}
                />
              ))}
            </div>
          )}

          {/* Product name + price overlay on image */}
          <div className="absolute bottom-0 inset-x-0 z-10 px-5 pb-7">
            {product.category && (
              <span className="inline-block font-cabin text-white/65 text-[11px] uppercase tracking-[0.18em] font-semibold mb-1">
                {product.category.name}
              </span>
            )}
            <h1 className="font-calistoga text-white text-[1.75rem] leading-tight drop-shadow-sm">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-calistoga text-white text-2xl">
                {formatPrice(product.price)}
              </span>
              {product.attributes &&
                Object.keys(product.attributes).length > 0 && (
                  <span className="font-cabin text-white/60 text-xs">
                    {t("price.starting")}
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* ── Content card — slides up over the image ── */}
        <div className="relative z-10 -mt-5 rounded-t-[2rem] bg-elite-cream shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
          <div className="px-5 pt-5 pb-6">
            {/* Drag handle hint */}
            <div className="w-10 h-1 bg-elite-burgundy/20 rounded-full mx-auto mb-5" />

            {/* Description */}
            {product.description && (
              <p className="font-cabin text-elite-black/65 text-sm leading-relaxed mb-5">
                {product.description}
              </p>
            )}

            {/* Divider */}
            {product.description && (
              <div className="h-px bg-elite-burgundy/10 mb-5" />
            )}

            {/* Attributes */}
            {product.attributes &&
              Object.keys(product.attributes).length > 0 && (
                <div className="space-y-5 mb-5">
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
                  <div className="h-px bg-elite-burgundy/10" />
                </div>
              )}

            {/* Quantity selector */}
            <div className="flex items-center justify-between mb-5">
              <span className="font-cabin text-sm font-semibold text-elite-black/70">
                {t("quantity")}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !product.available}
                  className="w-9 h-9 rounded-full bg-elite-burgundy/8 flex items-center justify-center active:scale-95 transition-all touch-manipulation disabled:opacity-40"
                >
                  <Minus
                    className="w-4 h-4 text-elite-burgundy"
                    strokeWidth={2.5}
                  />
                </button>
                <span className="font-calistoga text-elite-black text-xl w-6 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  disabled={!product.available}
                  className="w-9 h-9 rounded-full bg-elite-burgundy/8 flex items-center justify-center active:scale-95 transition-all touch-manipulation disabled:opacity-40"
                >
                  <Plus
                    className="w-4 h-4 text-elite-burgundy"
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            </div>

            {/* Ordering disabled notice */}
            {!orderingEnabled && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="font-cabin text-xs text-amber-800/90">
                  {t("actions.notifyHint", { message: disabledMessage })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky Add-to-cart bar ── */}
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-elite-cream via-elite-cream/98 to-elite-cream/0">
          <button
            onClick={handleAddToCart}
            disabled={!product.available || addedToCart}
            className={cn(
              "w-full py-4 rounded-2xl font-cabin font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.97] touch-manipulation",
              !product.available
                ? "bg-elite-black/10 text-elite-black/40 cursor-not-allowed"
                : addedToCart
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/35",
            )}
          >
            {!product.available ? (
              t("stock.soldOut")
            ) : addedToCart ? (
              <>
                <Check className="w-5 h-5" />
                {orderingEnabled ? t("actions.added") : t("actions.notified")}
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                {orderingEnabled
                  ? `${t("actions.addToCart")} · ${formatPrice(totalPrice)}`
                  : t("actions.notifyMe")}
              </>
            )}
          </button>
        </div>

        {/* ── Reviews (below the card) ── */}
        <div className="bg-white mx-3 rounded-3xl shadow-sm border border-elite-burgundy/8 mt-4 p-5">
          <ReviewsSection
            reviews={reviews}
            stats={stats}
            reviewsLoading={reviewsLoading}
          />
        </div>

        {/* ── Related products ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-4 mb-6 px-3">
            <h2 className="font-calistoga text-elite-black text-xl mb-3">
              {t("related.title")}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory scrollbar-hide">
              {relatedProducts.map((rp) => (
                <div key={rp.id} className="flex-shrink-0 w-[200px] snap-start">
                  <DrinkCard
                    id={rp.id}
                    name={rp.name}
                    price={rp.price}
                    images={rp.images}
                    available={rp.available}
                    href={`/products/${rp.id}`}
                    menuItemId={rp.id}
                    showAddToOrder={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer so the sticky add-to-cart bar never covers content */}
        <div
          style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
        />
      </div>

      {/* ═══════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* Desktop breadcrumb bar */}
        <div className="bg-elite-cream/80 backdrop-blur-sm border-b border-elite-burgundy/8">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
            <LocalizedLink
              href="/menu"
              className="inline-flex items-center gap-1.5 font-cabin text-sm text-elite-burgundy/70 hover:text-elite-burgundy transition-colors"
            >
              <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {t("actions.backToMenu")}
            </LocalizedLink>
            {product.category && (
              <>
                <span className="text-elite-black/20 font-cabin text-sm">
                  /
                </span>
                <LocalizedLink
                  href={`/menu/${product.category.id}`}
                  className="font-cabin text-sm text-elite-black/60 hover:text-elite-black transition-colors"
                >
                  {product.category.name}
                </LocalizedLink>
                <span className="text-elite-black/20 font-cabin text-sm">
                  /
                </span>
                <span className="font-cabin text-sm text-elite-black/80 truncate max-w-[200px]">
                  {product.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Desktop two-column content */}
        <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left: image gallery */}
            <div className="lg:sticky lg:top-24 h-fit">
              {/* Main image */}
              <div className="aspect-square rounded-[2rem] overflow-hidden border border-elite-burgundy/10 shadow-[0_20px_60px_rgba(139,38,53,0.12)] bg-gradient-to-b from-white/90 to-elite-cream relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {hasImages ? (
                    <ImageWithFallback
                      src={selectedImageCandidates}
                      alt={product.name}
                      fill
                      className="object-contain p-8"
                      objectFit="contain"
                      priority
                      quality={95}
                      showErrorIcon={false}
                      fallbackSrc={getFallbackImage("product")}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-elite-burgundy/30">
                      <Package className="w-24 h-24 mb-3" />
                      <p className="font-cabin text-sm">
                        {t("images.noImage")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stock badge */}
                <div className="absolute top-5 end-5 z-10">
                  {product.available ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-cabin font-bold shadow-md">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      {t("stock.inStock")}
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-cabin font-bold shadow-md">
                      {t("stock.soldOut")}
                    </div>
                  )}
                </div>

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute start-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg z-20"
                      aria-label={t("images.previous")}
                    >
                      <ChevronLeft
                        className={cn("w-5 h-5", isRTL && "rotate-180")}
                      />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute end-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg z-20"
                      aria-label={t("images.next")}
                    >
                      <ChevronRight
                        className={cn("w-5 h-5", isRTL && "rotate-180")}
                      />
                    </button>
                  </>
                )}

                {hasMultipleImages && (
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {displayImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`rounded-full transition-all duration-200 ${
                          index === currentImageIndex
                            ? "w-5 h-2 bg-elite-burgundy"
                            : "w-2 h-2 bg-elite-burgundy/30"
                        }`}
                        aria-label={t("images.viewImage", {
                          number: index + 1,
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {hasMultipleImages && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {displayImages.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-elite-burgundy shadow-md"
                          : "border-elite-burgundy/15 hover:border-elite-burgundy/40"
                      }`}
                    >
                      <ImageWithFallback
                        src={[image]}
                        alt={t("images.thumbnailAlt", {
                          name: product.name,
                          number: index + 1,
                        })}
                        fill
                        className="w-full h-full object-cover"
                        objectFit="cover"
                        showErrorIcon={false}
                        fallbackSrc={getFallbackImage("product")}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: product info */}
            <div className="space-y-6">
              {/* Category + name + price */}
              <div>
                {product.category && (
                  <LocalizedLink
                    href={`/menu/${product.category.id}`}
                    className="inline-flex items-center gap-1 text-elite-burgundy/55 hover:text-elite-burgundy font-cabin text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
                  >
                    {product.category.name}
                  </LocalizedLink>
                )}

                <h1 className="font-calistoga text-elite-burgundy text-3xl lg:text-[2.4rem] leading-tight tracking-[-0.01em]">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="mt-3 font-cabin text-elite-black/60 text-sm md:text-base leading-relaxed">
                    {product.description}
                  </p>
                )}

                <div className="flex items-baseline gap-2 mt-4">
                  <span className="font-calistoga text-elite-burgundy text-3xl">
                    {formatPrice(product.price)}
                  </span>
                  {product.attributes &&
                    Object.keys(product.attributes).length > 0 && (
                      <span className="font-cabin text-elite-black/40 text-sm">
                        {t("price.starting")}
                      </span>
                    )}
                </div>
              </div>

              <div className="h-px bg-elite-burgundy/10" />

              {/* Attributes */}
              {product.attributes &&
                Object.keys(product.attributes).length > 0 && (
                  <div className="space-y-5">
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
                    <div className="h-px bg-elite-black/5" />
                  </div>
                )}

              {/* Quantity + total + CTA */}
              <div className="bg-white/60 rounded-2xl border border-elite-burgundy/8 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-cabin text-sm font-semibold text-elite-black/70">
                    {t("quantity")}
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || !product.available}
                      className="w-9 h-9 rounded-full bg-elite-burgundy/8 flex items-center justify-center hover:bg-elite-burgundy/14 active:scale-95 transition-all disabled:opacity-40"
                    >
                      <Minus
                        className="w-4 h-4 text-elite-burgundy"
                        strokeWidth={2.5}
                      />
                    </button>
                    <span className="font-calistoga text-elite-black text-2xl w-6 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                      disabled={!product.available}
                      className="w-9 h-9 rounded-full bg-elite-burgundy/8 flex items-center justify-center hover:bg-elite-burgundy/14 active:scale-95 transition-all disabled:opacity-40"
                    >
                      <Plus
                        className="w-4 h-4 text-elite-burgundy"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-cabin text-sm text-elite-black/50">
                    {t("price.total")}
                  </span>
                  <span className="font-calistoga text-elite-burgundy text-2xl">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {!orderingEnabled && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="font-cabin text-xs text-amber-800/90">
                      {t("actions.notifyHint", { message: disabledMessage })}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={!product.available || addedToCart}
                  className={cn(
                    "w-full py-4 rounded-2xl font-cabin font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]",
                    !product.available
                      ? "bg-elite-black/10 text-elite-black/40 cursor-not-allowed"
                      : addedToCart
                        ? "bg-emerald-500 text-white shadow-emerald-500/30"
                        : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/30",
                  )}
                >
                  {!product.available ? (
                    t("stock.soldOut")
                  ) : addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      {orderingEnabled
                        ? t("actions.added")
                        : t("actions.notified")}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {orderingEnabled
                        ? t("actions.addToCart")
                        : t("actions.notifyMe")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-14 bg-white/60 rounded-3xl border border-elite-burgundy/8 p-6 lg:p-10">
            <ReviewsSection
              reviews={reviews}
              stats={stats}
              reviewsLoading={reviewsLoading}
            />
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <div className="mb-6">
                <h2 className="font-calistoga text-elite-burgundy text-2xl lg:text-3xl font-bold mb-1">
                  {t("related.title")}
                </h2>
                <p className="font-cabin text-elite-black/55 text-sm">
                  {t("related.subtitle", {
                    category:
                      product.category?.name || t("related.thisCategory"),
                  })}
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                {relatedProducts.map((rp) => (
                  <DrinkCard
                    key={rp.id}
                    id={rp.id}
                    name={rp.name}
                    price={rp.price}
                    images={rp.images}
                    available={rp.available}
                    href={`/products/${rp.id}`}
                    menuItemId={rp.id}
                    showAddToOrder={true}
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

/* ─────────────────────────────────────────────
   Reviews section (shared between mobile/desktop)
──────────────────────────────────────────────── */
function ReviewsSection({
  reviews,
  stats,
  reviewsLoading,
}: {
  reviews: ReturnType<typeof useReviews>["reviews"];
  stats: ReturnType<typeof useReviews>["stats"];
  reviewsLoading: boolean;
}) {
  const t = useTranslations("productDetail");
  return (
    <div>
      <div className="flex items-start sm:items-center justify-between mb-5 flex-col sm:flex-row gap-3">
        <h2 className="font-calistoga text-elite-burgundy text-2xl font-bold">
          {t("reviews.title")}
        </h2>
        {stats && stats.total > 0 && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-elite-burgundy/15 shadow-sm">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-elite-burgundy text-elite-burgundy"
                      : "text-elite-burgundy/20"
                  }`}
                />
              ))}
            </div>
            <span className="font-cabin text-elite-burgundy font-bold text-sm">
              {stats.averageRating.toFixed(1)}
            </span>
            <span className="font-cabin text-elite-black/50 text-xs">
              {t("reviews.count", { count: stats.total })}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {reviewsLoading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-full border-2 border-elite-burgundy border-t-transparent animate-spin mx-auto" />
            <p className="mt-3 font-cabin text-elite-burgundy/60 text-sm">
              {t("reviews.loading")}
            </p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-elite-burgundy/8 flex items-center justify-center mx-auto mb-3">
              <Star className="w-7 h-7 text-elite-burgundy/40" />
            </div>
            <h4 className="font-calistoga text-elite-black text-lg mb-1">
              {t("reviews.empty.title")}
            </h4>
            <p className="font-cabin text-elite-black/50 text-sm">
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
  );
}
