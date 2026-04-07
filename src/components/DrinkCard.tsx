"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, ChevronRight, Plus } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { sanitizeImages } from "@/lib/imageUtils";
import { cn, slugify, extractBaseName } from "@/lib/utils";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useFormatter, useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { useOrdering } from "@/context/OrderingContext";

interface DealInfo {
  originalPrice: number;
  dealPrice: number;
  dealActive: boolean;
  savings: number;
  savingsPercent: number;
}

interface DrinkCardProps {
  id?: string;
  images?: string[];
  name?: string;
  price?: number;
  description?: string;
  available?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  href?: string;
  menuItemId?: string;
  showAddToOrder?: boolean;
  categoryId?: string;
  onQuickAdd?: () => void;
  animationDelay?: number;
  /**
   * Cache-buster for local `/Old Items/` images.
   * This avoids Next.js image optimizer serving a stale cached transform after we regenerate assets.
   */
  imageVersion?: string | null;
  // Deal-specific props
  dealInfo?: DealInfo;
  isDealsPage?: boolean; // If true, show deal details inside card
}

const sizeClasses = {
  small: {
    image: "h-40 sm:h-52",
    title: "text-sm sm:text-base leading-tight",
    price: "text-base sm:text-lg",
    padding: "p-2 sm:p-2.5",
    contentPadding: "px-2.5 sm:px-3 pb-2.5 sm:pb-3",
  },
  medium: {
    image: "h-36 sm:h-44",
    title: "text-base sm:text-xl",
    price: "text-lg sm:text-2xl",
    padding: "p-2.5 sm:p-3",
    contentPadding: "px-3 sm:px-4 pb-3 sm:pb-4",
  },
  large: {
    image: "h-40 sm:h-52",
    title: "text-lg sm:text-2xl",
    price: "text-xl sm:text-3xl",
    padding: "p-3 sm:p-4",
    contentPadding: "px-4 sm:px-6 pb-4 sm:pb-5",
  },
};

export default function DrinkCard({
  id,
  images,
  name,
  price,
  description,
  available = true,
  size = "medium",
  className = "",
  href,
  menuItemId,
  showAddToOrder = false,
  categoryId,
  onQuickAdd,
  animationDelay = 0,
  imageVersion = null,
  dealInfo,
  isDealsPage = false,
}: DrinkCardProps) {
  const t = useTranslations("drinkCard");
  const format = useFormatter();
  const { addItem } = useLocalCart();
  const { orderingEnabled } = useOrdering();
  const [addToOrderState, setAddToOrderState] = useState({
    adding: false,
    added: false,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Sanitize and validate images
  const validImages = sanitizeImages(images);
  const displayName = name || t("unnamed");

  // Inject Local Image from Old Items directory
  // We use the normalized name (extractBaseName) to match the image naming pattern
  let displayImages = validImages;
  if (name) {
    const baseName = extractBaseName(name);
    // Use -1.png naming convention from Old Items directory
    const v = imageVersion ? encodeURIComponent(imageVersion) : "";
    const localImage = `/Old Items/${baseName}-1.png${v ? `?v=${v}` : ""}`;
    // Keep Old Items as a last-resort fallback to avoid noisy 404s when files are missing.
    displayImages = [...validImages, localImage];
  }

  // Determine display price: use deal price if active, otherwise original or regular price
  const displayPrice = dealInfo?.dealActive
    ? dealInfo.dealPrice
    : typeof price === "number"
      ? price
      : null;

  const originalPrice = dealInfo?.originalPrice || displayPrice;
  const isAvailable = available !== false && dealInfo?.dealActive !== false;

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  const handleAddToOrder = useCallback(
    async (e: React.MouseEvent) => {
      if (!orderingEnabled) {
        // In paused-ordering mode, list cards should funnel users to details.
        if (onQuickAdd) {
          e.preventDefault();
          e.stopPropagation();
          onQuickAdd();
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const productId = menuItemId || id;
      if (!productId) {
        console.warn("DrinkCard: Missing product id", { id, menuItemId, name });
        return;
      }

      if (onQuickAdd) {
        onQuickAdd();
        return;
      }
      setAddToOrderState({ adding: true, added: false });
      try {
        // Add to local cart
        addItem({
          productId,
          name: displayName,
          basePrice: displayPrice || 0,
          quantity: 1,
          attributes: {},
          totalPrice: displayPrice || 0,
          image: displayImages[0],
        });

        setAddToOrderState({ adding: false, added: true });
        setTimeout(
          () => setAddToOrderState({ adding: false, added: false }),
          2000,
        );
      } catch (err) {
        console.error("Failed to add to cart:", err);
        setAddToOrderState({ adding: false, added: false });
      }
    },
    [
      menuItemId,
      id,
      name,
      onQuickAdd,
      addItem,
      displayName,
      displayPrice,
      displayImages,
      orderingEnabled,
    ],
  );

  // Adaptive animation classes
  const animDuration = prefersReducedMotion ? "duration-100" : "duration-300";
  const sizes = sizeClasses[size];

  // Adaptive text sizing based on title length
  const titleLength = displayName.length;
  const adaptiveTitleSize = (() => {
    if (titleLength > 40) return "text-xs sm:text-sm";
    if (titleLength > 25) return "text-sm sm:text-base";
    return sizes.title;
  })();

  const adaptivePriceSize = (() => {
    if (titleLength > 40) return "text-sm sm:text-base";
    if (titleLength > 25) return "text-base sm:text-lg";
    return sizes.price;
  })();

  const imgSizes =
    size === "small"
      ? "(max-width: 640px) 160px, (max-width: 1024px) 250px, 300px"
      : size === "medium"
        ? "(max-width: 640px) 250px, (max-width: 1024px) 350px, 450px"
        : "(max-width: 768px) 100vw, 800px";

  const CardContent = () => (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl overflow-hidden h-full flex flex-col",
        // Premium multi-layer shadows
        "shadow-[0_2px_8px_rgba(139,0,0,0.08),0_4px_16px_rgba(139,0,0,0.06)]",
        "border border-elite-burgundy/10",
        "transition-all touch-manipulation",
        animDuration,
        // Entrance animation
        prefersReducedMotion
          ? "opacity-100"
          : isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4",
        // Enhanced hover effects (desktop only)
        "md:hover:shadow-[0_8px_24px_rgba(139,0,0,0.12),0_4px_16px_rgba(139,0,0,0.08)]",
        "md:hover:border-elite-burgundy/20",
        "md:hover:-translate-y-1.5",
        "md:hover:scale-[1.02]",
        // Active/press effect
        "active:scale-[0.98]",
        !isAvailable && "opacity-60",
        className,
      )}
      style={{
        transitionProperty: "opacity, transform, box-shadow, border-color",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Image Container */}
      <div className={cn("relative", sizes.padding)}>
        <div
          className={cn(
            "relative bg-gradient-to-b from-elite-cream/60 to-elite-burgundy/8 rounded-xl sm:rounded-2xl overflow-hidden",
            "group-hover:shadow-inner",
            sizes.image,
            "p-1", // Reduced padding for zoomed-in effect
          )}
        >
          {/* Image with enhanced hover effect */}
          <div className="relative w-full h-full overflow-hidden rounded-xl sm:rounded-2xl">
            <ImageWithFallback
              src={displayImages}
              alt={displayName}
              className={cn(
                "w-full h-full object-contain transition-all", // Changed to contain
                animDuration,
                "group-hover:scale-110",
              )}
              fill={true}
              objectFit="contain" // Changed to contain
              showErrorIcon={true}
              quality={95}
              sizes={imgSizes}
            />
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-elite-burgundy/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Enhanced FOMO Badge for Big Deals (on image corner) */}
          {dealInfo && isDealsPage && dealInfo.savingsPercent >= 20 && (
            <div className="absolute top-2 right-2 z-10">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl blur-sm opacity-75 animate-pulse" />
                {/* Badge */}
                <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white px-3.5 py-2 rounded-xl shadow-2xl border-2 border-white/40 transform rotate-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-calistoga font-bold drop-shadow-sm">
                      🔥 {dealInfo.savingsPercent.toFixed(0)}% OFF
                    </span>
                  </div>
                  {/* Decorative corner dot */}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-teal-800 rounded-full border-2 border-white/40 shadow-lg" />
                </div>
              </div>
            </div>
          )}

          {/* Unavailable overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-elite-black/80 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-cabin font-semibold">
                {t("soldOut")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content - Compact on mobile */}
      <div className={cn("flex-1 flex flex-col", sizes.contentPadding)}>
        <h4
          className={cn(
            "font-calistoga text-elite-black font-bold line-clamp-2 mb-0.5 sm:mb-1",
            adaptiveTitleSize,
          )}
          title={displayName}
        >
          {displayName}
        </h4>

        {/* Price Display - Deal-aware with enhanced styling */}
        {displayPrice !== null && (
          <div className="mt-2.5 space-y-1.5">
            {dealInfo && isDealsPage ? (
              // Deal page: Show deal details inside card with premium styling
              <div className="space-y-2">
                {/* Original Price (strikethrough, grayed out) - More subtle */}
                {/* Show original price if it's different from deal price (even if savings is 0 due to rounding) */}
                {dealInfo.originalPrice !== dealInfo.dealPrice &&
                  dealInfo.originalPrice > 0 && (
                    <p className="text-xs sm:text-sm font-cabin text-elite-black/35 line-through decoration-elite-black/30">
                      {formatPrice(dealInfo.originalPrice)}
                    </p>
                  )}

                {/* Deal Price (bigger, more attractive with gradient effect) */}
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <div className="relative">
                    {/* Subtle text shadow for depth */}
                    <p
                      className={cn(
                        "font-calistoga font-bold leading-tight",
                        "bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy bg-clip-text text-transparent",
                        "drop-shadow-sm",
                        dealInfo.savingsPercent >= 20
                          ? "text-2xl sm:text-3xl" // Bigger for big deals
                          : adaptivePriceSize,
                      )}
                    >
                      {formatPrice(dealInfo.dealPrice)}
                    </p>
                  </div>

                  {/* Enhanced Savings Pill (only for deals < 20% - big deals have FOMO badge on image) */}
                  {/* Show savings pill if there's any savings and it's less than 20% (big deals show FOMO badge) */}
                  {dealInfo.savings > 0 &&
                    dealInfo.savingsPercent > 0 &&
                    dealInfo.savingsPercent < 20 && (
                      <span className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-cabin font-bold shadow-sm border border-emerald-200/50">
                        {t("savePercent", {
                          percent: dealInfo.savingsPercent.toFixed(0),
                        })}
                      </span>
                    )}
                </div>

                {/* Deal Status Message */}
                {!dealInfo.dealActive && (
                  <p className="text-xs font-cabin text-amber-600 mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    {t("dealInactive")}
                  </p>
                )}
              </div>
            ) : (
              // Regular page: Simple price display
              <p
                className={cn(
                  "font-cabin text-elite-burgundy font-bold",
                  adaptivePriceSize,
                )}
              >
                {formatPrice(displayPrice)}
              </p>
            )}
          </div>
        )}

        {/* Enhanced Action Button - Premium rounded pill style */}
        {showAddToOrder && menuItemId && isAvailable && (
          <div className="mt-auto pt-3 sm:pt-4">
            <button
              onClick={handleAddToOrder}
              disabled={orderingEnabled ? addToOrderState.adding : false}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-cabin font-bold",
                "transition-all touch-manipulation active:scale-[0.97]",
                "min-h-[44px] sm:min-h-[48px]",
                animDuration,
                !orderingEnabled
                  ? "bg-gradient-to-r from-white to-elite-cream text-elite-burgundy border border-elite-burgundy/20 shadow-sm hover:shadow-md"
                  : addToOrderState.added
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                    : "bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream shadow-lg shadow-elite-burgundy/25 hover:shadow-xl hover:shadow-elite-burgundy/35 hover:scale-[1.02]",
              )}
              aria-live="polite"
            >
              {!orderingEnabled ? (
                <>
                  <span>{t("seeMore")}</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
                </>
              ) : addToOrderState.added ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{t("added")}</span>
                </>
              ) : addToOrderState.adding ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-elite-cream border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    strokeWidth={2.5}
                  />
                  <span>{t("add")}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <LocalizedLink href={href} className="block group h-full">
      <CardContent />
    </LocalizedLink>
  ) : (
    <div className="group h-full">
      <CardContent />
    </div>
  );
}
