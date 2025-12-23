"use client";

import { useState, useCallback, useEffect } from "react";
import { ShoppingCart, Check, Plus } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { sanitizeImages } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { useLocalCart } from "@/hooks/useLocalCart";

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
  // Deal-specific props
  dealInfo?: DealInfo;
  isDealsPage?: boolean; // If true, show deal details inside card
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
  dealInfo,
  isDealsPage = false,
}: DrinkCardProps) {
  const { addItem } = useLocalCart();
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
  const displayName = name || "Unnamed Product";
  
  // Determine display price: use deal price if active, otherwise original or regular price
  const displayPrice = dealInfo?.dealActive 
    ? dealInfo.dealPrice 
    : (typeof price === "number" ? price : null);
  
  const originalPrice = dealInfo?.originalPrice || displayPrice;
  const isAvailable = available !== false && (dealInfo?.dealActive !== false);

  const handleAddToOrder = useCallback(async (e: React.MouseEvent) => {
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
        image: validImages[0],
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
  }, [menuItemId, id, name, onQuickAdd, addItem, displayName, displayPrice, validImages]);

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

  const CardContent = () => (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-elite-burgundy/8 overflow-hidden h-full flex flex-col",
        "transition-all touch-manipulation",
        animDuration,
        // Entrance animation
        prefersReducedMotion 
          ? "opacity-100" 
          : isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-3",
        // Hover effects (desktop only)
        "md:hover:shadow-xl md:hover:border-elite-burgundy/15 md:hover:-translate-y-1",
        // Active/press effect
        "active:scale-[0.98]",
        !isAvailable && "opacity-60",
        className
      )}
      style={{
        transitionProperty: 'opacity, transform, box-shadow, border-color',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Image Container */}
      <div className={cn("relative", sizes.padding)}>
        <div
          className={cn(
            "relative bg-gradient-to-b from-elite-cream/60 to-elite-burgundy/8 rounded-xl sm:rounded-2xl overflow-hidden",
            sizes.image
          )}
        >
          <ImageWithFallback
            src={validImages}
            alt={displayName}
            className={cn(
              "w-full h-full object-cover transition-transform",
              animDuration,
              "group-hover:scale-105"
            )}
            fill={true}
            objectFit="cover"
            showErrorIcon={true}
          />
          
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

      {/* Content - Compact on mobile */}
      <div className={cn("flex-1 flex flex-col", sizes.contentPadding)}>
        <h4 
          className={cn(
            "font-calistoga text-elite-black font-bold line-clamp-2 mb-0.5 sm:mb-1",
            adaptiveTitleSize
          )} 
          title={displayName}
        >
          {displayName}
        </h4>
        
        {/* Price Display - Deal-aware */}
        {displayPrice !== null && (
          <div className="space-y-0.5 sm:space-y-1">
            {dealInfo && isDealsPage ? (
              // Deal page: Show deal details inside card
              <div className="space-y-1">
                {dealInfo.dealActive && dealInfo.savings > 0 ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        "font-cabin text-elite-burgundy font-bold",
                        adaptivePriceSize
                      )}>
                        EGP {dealInfo.dealPrice.toFixed(0)}
                      </p>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-cabin font-semibold">
                        Save {dealInfo.savingsPercent}%
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-cabin text-elite-black/50 line-through">
                      {dealInfo.originalPrice.toFixed(0)} EGP
                    </p>
                  </>
                ) : (
                  <>
                    <p className={cn(
                      "font-cabin text-elite-burgundy font-bold",
                      adaptivePriceSize
                    )}>
                      EGP {displayPrice.toFixed(0)}
                    </p>
                    {!dealInfo.dealActive && dealInfo.dealPrice !== dealInfo.originalPrice && (
                      <p className="text-[10px] sm:text-xs font-cabin text-amber-600">
                        Deal: {dealInfo.dealPrice.toFixed(0)} EGP
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Regular page: Simple price display
              <p className={cn(
                "font-cabin text-elite-burgundy font-bold",
                adaptivePriceSize
              )}>
                EGP {displayPrice.toFixed(0)}
              </p>
            )}
          </div>
        )}
        
        {/* Action Button - Rounded pill style */}
        {showAddToOrder && menuItemId && isAvailable && (
          <div className="mt-auto pt-2 sm:pt-3">
            <button
              onClick={handleAddToOrder}
              disabled={addToOrderState.adding}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-cabin font-bold",
                "shadow-md transition-all touch-manipulation active:scale-[0.97]",
                animDuration,
                "min-h-[40px] sm:min-h-[48px]",
                addToOrderState.added
                  ? "bg-emerald-500 text-white shadow-emerald-500/25"
                  : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/25"
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
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block group h-full">
      <CardContent />
    </a>
  ) : (
    <div className="group h-full">
      <CardContent />
    </div>
  );
}
