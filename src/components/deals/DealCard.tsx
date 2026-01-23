"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Tag } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { getLocalProductImageCandidates, sanitizeImages } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { useLocalCart } from "@/hooks/useLocalCart";

interface DealInfo {
  originalPrice: number;
  dealPrice: number;
  dealActive: boolean;
  savings: number;
  savingsPercent: number;
}

interface DealCardProps {
  id: string;
  name: string;
  images?: string[];
  originalPrice: number;
  dealPrice: number;
  dealActive: boolean;
  savings: number;
  savingsPercent: number;
  description?: string;
  available?: boolean;
  categoryId?: string;
  onQuickAdd?: () => void;
  animationDelay?: number;
  size?: "small" | "medium" | "large";
}

const sizeClasses = {
  small: {
    image: "h-32 sm:h-44",
    title: "text-sm sm:text-base leading-tight",
    price: "text-base sm:text-lg",
    padding: "p-2 sm:p-2.5",
    contentPadding: "px-2.5 sm:px-3 pb-2.5 sm:pb-3",
  },
  medium: {
    image: "h-44 sm:h-56",
    title: "text-base sm:text-xl",
    price: "text-lg sm:text-2xl",
    padding: "p-2.5 sm:p-3",
    contentPadding: "px-3 sm:px-4 pb-3 sm:pb-4",
  },
  large: {
    image: "h-52 sm:h-64",
    title: "text-lg sm:text-2xl",
    price: "text-xl sm:text-3xl",
    padding: "p-3 sm:p-4",
    contentPadding: "px-4 sm:px-6 pb-4 sm:pb-5",
  },
};

export default function DealCard({
  id,
  name,
  images,
  originalPrice,
  dealPrice,
  dealActive,
  savings,
  savingsPercent,
  description,
  available = true,
  categoryId,
  onQuickAdd,
  animationDelay = 0,
  size = "small",
}: DealCardProps) {
  const { addItem } = useLocalCart();
  const [addToOrderState, setAddToOrderState] = useState({
    adding: false,
    added: false,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const validImages = sanitizeImages(images);
  const displayName = name || "Unnamed Product";
  const isAvailable = available !== false && dealActive;
  const sizes = sizeClasses[size];
  const animDuration = "duration-300";

  // Adaptive text sizing based on content length
  const adaptiveTitleSize =
    displayName.length > 20 ? "text-xs sm:text-sm" : sizes.title;

  const adaptivePriceSize =
    dealPrice.toString().length > 4 ? "text-base sm:text-lg" : sizes.price;

  const handleAddToOrder = async () => {
    if (!isAvailable || addToOrderState.adding) return;

    setAddToOrderState({ adding: true, added: false });

    try {
      addItem({
        productId: id,
        name: displayName,
        basePrice: dealPrice,
        quantity: 1,
        attributes: {},
        totalPrice: dealPrice,
        image: getLocalProductImageCandidates(displayName)[0] || validImages[0],
      });

      setAddToOrderState({ adding: false, added: true });
      setTimeout(() => {
        setAddToOrderState({ adding: false, added: false });
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setAddToOrderState({ adding: false, added: false });
    }
  };

  const CardContent = () => (
    <div
      className={cn(
        "flex flex-col h-full bg-white rounded-xl sm:rounded-2xl overflow-hidden",
        "shadow-lg shadow-elite-burgundy/10 border border-elite-burgundy/10",
        "transition-all",
        animDuration,
        "group",
        "md:hover:shadow-xl md:hover:border-elite-burgundy/15 md:hover:-translate-y-1",
        !isVisible && "opacity-0 translate-y-4",
        isVisible && "opacity-100 translate-y-0",
        sizes.padding,
      )}
    >
      {/* Image Container */}
      <div className="relative mb-2 sm:mb-3">
        <div
          className={cn(
            "relative bg-gradient-to-b from-elite-cream/60 to-elite-burgundy/8 rounded-xl sm:rounded-2xl overflow-hidden",
            "group-hover:shadow-inner",
            sizes.image,
          )}
        >
          <div className="relative w-full h-full overflow-hidden rounded-xl sm:rounded-2xl">
            <ImageWithFallback
              src={validImages}
              alt={displayName}
              className={cn(
                "w-full h-full object-cover transition-all",
                animDuration,
                "group-hover:scale-110",
              )}
              fill={true}
              objectFit="cover"
              showErrorIcon={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-elite-burgundy/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Discount Badge (Top Right) - Only for deals >= 20% - Fully Rounded Pill */}
          {savingsPercent >= 20 && dealActive && (
            <div className="absolute top-2 right-2 z-10">
              <div className="relative">
                {/* Subtle glow */}
                <div className="absolute inset-0 bg-elite-burgundy/20 rounded-full blur-sm" />
                {/* Badge - Fully Rounded Pill */}
                <div className="relative bg-elite-burgundy text-elite-cream px-3 py-1.5 rounded-full shadow-lg border border-elite-cream/30">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span className="text-xs sm:text-sm font-calistoga font-bold">
                      {savingsPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unavailable overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-elite-black/80 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-cabin font-semibold">
                Sold out
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn("flex-1 flex flex-col", sizes.contentPadding)}>
        <h4
          className={cn(
            "font-calistoga text-elite-black font-bold line-clamp-2 mb-2",
            adaptiveTitleSize,
          )}
          title={displayName}
        >
          {displayName}
        </h4>

        {/* Price Display - Clean, Premium Design */}
        <div className="mt-auto space-y-1.5">
          {/* Original Price (strikethrough) */}
          {originalPrice !== dealPrice && originalPrice > 0 && (
            <p className="text-xs sm:text-sm font-cabin text-elite-black/40 line-through decoration-elite-black/30">
              {originalPrice.toFixed(0)} EGP
            </p>
          )}

          {/* Deal Price - Prominent */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <p
              className={cn(
                "font-calistoga font-bold leading-tight",
                "text-elite-burgundy",
                savingsPercent >= 20
                  ? "text-xl sm:text-2xl"
                  : adaptivePriceSize,
              )}
            >
              {dealPrice.toFixed(0)}{" "}
              <span className="text-base sm:text-lg">EGP</span>
            </p>

            {/* Savings Badge (Only for deals < 20% - subtle) */}
            {savings > 0 &&
              savingsPercent > 0 &&
              savingsPercent < 20 &&
              dealActive && (
                <span className="inline-flex items-center bg-elite-cream/80 text-elite-burgundy px-2 py-1 rounded-md text-xs font-cabin font-semibold border border-elite-burgundy/20">
                  Save {savingsPercent.toFixed(0)}%
                </span>
              )}
          </div>

          {/* Deal Status Message */}
          {!dealActive && (
            <p className="text-xs font-cabin text-elite-black/60 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-elite-burgundy/60 rounded-full" />
              Not currently active
            </p>
          )}
        </div>

        {/* Action Button */}
        {isAvailable && (
          <div className="mt-3 sm:mt-4">
            <button
              onClick={onQuickAdd || handleAddToOrder}
              disabled={addToOrderState.adding}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-cabin font-bold",
                "transition-all touch-manipulation active:scale-[0.97]",
                "min-h-[40px] sm:min-h-[44px]",
                animDuration,
                addToOrderState.added
                  ? "bg-elite-burgundy/80 text-elite-cream"
                  : "bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream shadow-md shadow-elite-burgundy/20 hover:shadow-lg hover:shadow-elite-burgundy/30 hover:scale-[1.02]",
              )}
              aria-live="polite"
            >
              {addToOrderState.added ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Added!</span>
                </>
              ) : addToOrderState.adding ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-elite-cream border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    strokeWidth={2.5}
                  />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return <CardContent />;
}
