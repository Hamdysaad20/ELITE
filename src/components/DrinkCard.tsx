"use client";

import { useState, useCallback } from "react";
import { ShoppingCart, Check } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { sanitizeImages, getFirstValidImage } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

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
}

const sizeClasses = {
  small: {
    container: "aspect-square",
    imageContainer: "h-52",
  },
  medium: {
    container: "aspect-square",
    imageContainer: "h-60",
  },
  large: {
    container: "aspect-square",
    imageContainer: "h-68",
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
}: DrinkCardProps) {
  const { addToCart, isUpdating } = useCart();
  const [addToOrderState, setAddToOrderState] = useState({
    adding: false,
    added: false,
  });

  // Sanitize and validate images
  const validImages = sanitizeImages(images);
  const displayName = name || "Unnamed Product";
  const displayPrice = typeof price === "number" ? price : null;
  const isAvailable = available !== false;
  
  // Debug logging in development
  if (process.env.NODE_ENV === "development" && !displayName) {
    console.warn("DrinkCard: Missing name", { id, name, price, images, available });
  }

  const handleAddToOrder = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!menuItemId || addToOrderState.adding || !isAvailable) return;

    setAddToOrderState({ adding: true, added: false });
    try {
      // Use optimistic cart hook - instant UI update
      await addToCart(menuItemId, 1, { size: "Medium" });
      
      setAddToOrderState({ adding: false, added: true });
      setTimeout(
        () => setAddToOrderState({ adding: false, added: false }),
        2000,
      );
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setAddToOrderState({ adding: false, added: false });
      
      // Handle auth error
      if (err instanceof Error && err.message.includes("sign in")) {
        window.location.href =
          "/auth/signin?callbackUrl=" +
          encodeURIComponent(window.location.pathname);
      }
    }
  }, [menuItemId, addToOrderState.adding, isAvailable, addToCart]);

  const classes = sizeClasses[size];

  const CardContent = () => (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:scale-105 group",
        !isAvailable && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className={`relative ${classes.container} p-4 sm:p-6`}>
        <div
          className={cn(
            "bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl sm:rounded-3xl transition-transform group-hover:scale-110 relative overflow-hidden",
            classes.imageContainer
          )}
        >
          <ImageWithFallback
            src={validImages}
            alt={displayName}
            className="w-full h-full rounded-2xl sm:rounded-3xl"
            objectFit="contain"
            showErrorIcon={true}
          />
        </div>
        
        {/* Unavailable badge */}
        {!isAvailable && (
          <div className="absolute top-6 right-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-cabin font-semibold">
            Unavailable
          </div>
        )}
      </div>

      <div className="text-center space-y-2 sm:space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
        <h4 className="font-calistoga text-elite-black font-bold text-xl sm:text-2xl lg:text-3xl leading-tight h-16 sm:h-20 flex items-center justify-center line-clamp-2">
          {displayName}
        </h4>
        {displayPrice !== null && (
          <p className="font-cabin text-elite-burgundy font-bold text-xl sm:text-2xl lg:text-3xl pt-2">
            EGP {displayPrice.toFixed(2)}
          </p>
        )}
        {description && (
          <p className="font-cabin text-elite-black/70 text-sm leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        {showAddToOrder && menuItemId && isAvailable && (
          <button
            onClick={handleAddToOrder}
            disabled={addToOrderState.adding}
            className={cn(
              "mt-4 w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-base tracking-wide shadow-md transition-all duration-300",
              addToOrderState.added
                ? "bg-emerald-600 text-white font-calistoga"
                : "bg-elite-burgundy text-elite-cream font-calistoga hover:bg-elite-dark-burgundy hover:scale-105 hover:shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-live="polite"
          >
            {addToOrderState.added ? (
              <>
                <Check className="w-5 h-5" />
                <span>Added!</span>
              </>
            ) : addToOrderState.adding ? (
              <span className="font-cabin">Adding...</span>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Order</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block">
      <CardContent />
    </a>
  ) : (
    <CardContent />
  );
}
