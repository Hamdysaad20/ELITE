"use client";

import { useState, useCallback } from "react";
import { ShoppingCart, Check } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { sanitizeImages, getFirstValidImage } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { useLocalCart } from "@/hooks/useLocalCart";

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
}

const sizeClasses = {
  small: {
    container: "aspect-square",
    imageContainer: "h-64",
  },
  medium: {
    container: "aspect-square",
    imageContainer: "h-72",
  },
  large: {
    container: "aspect-square",
    imageContainer: "h-80",
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
}: DrinkCardProps) {
  const { addItem } = useLocalCart();
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
    
    if (onQuickAdd) {
      onQuickAdd();
      return;
    }

    if (!menuItemId || addToOrderState.adding || !isAvailable) return;

    setAddToOrderState({ adding: true, added: false });
    try {
      // Add to local cart
      addItem({
        productId: menuItemId,
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
  }, [menuItemId, addToOrderState.adding, isAvailable, onQuickAdd, addItem, displayName, displayPrice, validImages]);

  const classes = sizeClasses[size];

  const CardContent = () => (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 transition-all duration-300 hover:shadow-2xl hover:border-elite-burgundy/20 group h-full flex flex-col overflow-hidden",
        !isAvailable && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0 p-3 sm:p-4">
          <div
            className={cn(
              "bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl sm:rounded-3xl transition-transform duration-500 group-hover:scale-105 relative overflow-hidden flex items-center justify-center w-full h-full"
            )}
          >
            <ImageWithFallback
              src={validImages}
              alt={displayName}
              className="w-full h-full object-cover"
              objectFit="cover"
              showErrorIcon={true}
              fill={true}
            />
          </div>
          
          {/* Unavailable badge */}
          {!isAvailable && (
            <div className="absolute top-6 right-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-cabin font-semibold z-10">
              Unavailable
            </div>
          )}
        </div>
      </div>

      <div className="text-center space-y-2 sm:space-y-3 px-4 sm:px-6 pb-3 sm:pb-4 flex-1 flex flex-col">
        <h4 className="font-calistoga text-elite-black font-bold text-xl sm:text-2xl leading-tight truncate w-full" title={displayName}>
          {displayName}
        </h4>
        {displayPrice !== null && (
          <p className="font-cabin text-elite-burgundy font-bold text-xl sm:text-2xl pt-1">
            EGP {displayPrice.toFixed(2)}
          </p>
        )}
        
        <div className="mt-auto w-full pt-2 flex gap-2">
          {showAddToOrder && menuItemId && isAvailable && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (href) window.location.href = href;
                }}
                className="px-4 py-3 rounded-full text-sm tracking-wide transition-all duration-300 bg-transparent text-elite-black/50 hover:text-elite-burgundy font-cabin font-bold uppercase"
              >
                Details
              </button>
              <button
                onClick={handleAddToOrder}
                disabled={addToOrderState.adding}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-base tracking-wide shadow-md transition-all duration-300",
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
                    <span>Added</span>
                  </>
                ) : addToOrderState.adding ? (
                  <span className="font-cabin">...</span>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
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
