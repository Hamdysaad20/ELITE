"use client";

import { useState, useCallback, useEffect } from "react";
import { ShoppingCart, Check, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { sanitizeImages } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { useLocalCart } from "@/hooks/useLocalCart";
import type { ComboDeal } from "@/types/deals";

export interface ComboItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  categoryId?: string;
}

interface ComboDealCardProps {
  combo: ComboDeal;
  onAddToCart?: (combo: ComboDeal) => void;
  className?: string;
  animationDelay?: number;
}

export default function ComboDealCard({
  combo,
  onAddToCart,
  className = "",
  animationDelay = 0,
}: ComboDealCardProps) {
  const { addItem } = useLocalCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const hasMultipleItems = combo.items.length > 1;
  const currentItem = combo.items[currentIndex];
  const validImages = sanitizeImages(combo.items.map(item => item.image).filter(Boolean) as string[]);

  const nextItem = () => {
    if (hasMultipleItems) {
      setCurrentIndex((prev) => (prev + 1) % combo.items.length);
    }
  };

  const prevItem = () => {
    if (hasMultipleItems) {
      setCurrentIndex((prev) => (prev - 1 + combo.items.length) % combo.items.length);
    }
  };

  const handleAddToCart = useCallback(async () => {
    if (adding || !combo.dealActive) return;

    setAdding(true);
    try {
      if (onAddToCart) {
        onAddToCart(combo);
      } else {
        // Add all combo items to cart
        for (const item of combo.items) {
          addItem({
            productId: item.id,
            name: item.name,
            basePrice: item.price,
            quantity: 1,
            attributes: {},
            totalPrice: item.price,
            image: item.image,
          });
        }
      }
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        setAdding(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to add combo to cart:", err);
      setAdding(false);
    }
  }, [combo, adding, onAddToCart, addItem]);

  // Adaptive text sizing
  const titleLength = combo.name.length;
  const getTitleSize = () => {
    if (titleLength > 40) return "text-sm sm:text-base";
    if (titleLength > 25) return "text-base sm:text-lg";
    return "text-base sm:text-xl";
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-elite-burgundy/8 overflow-hidden",
        "transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        "md:hover:shadow-xl md:hover:border-elite-burgundy/15 md:hover:-translate-y-1",
        !combo.dealActive && "opacity-60",
        className
      )}
    >
      {/* Image Slider */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-b from-elite-cream/60 to-elite-burgundy/8">
        {validImages.length > 0 ? (
          <>
            <ImageWithFallback
              src={validImages[currentIndex % validImages.length] || validImages[0]}
              alt={currentItem.name}
              className="w-full h-full object-cover"
              fill={true}
              objectFit="cover"
              showErrorIcon={true}
            />
            
            {/* Slider Controls */}
            {hasMultipleItems && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevItem();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all"
                  aria-label="Previous item"
                >
                  <ChevronLeft className="w-4 h-4 text-elite-burgundy" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextItem();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all"
                  aria-label="Next item"
                >
                  <ChevronRight className="w-4 h-4 text-elite-burgundy" />
                </button>
                
                {/* Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {combo.items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        idx === currentIndex
                          ? "bg-elite-burgundy w-4"
                          : "bg-white/60 hover:bg-white/80"
                      )}
                      aria-label={`Go to item ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-16 h-16 text-elite-burgundy/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col h-full">
        <h3 className={cn(
          "font-calistoga text-elite-black font-bold mb-2 line-clamp-2",
          getTitleSize()
        )}>
          {combo.name}
        </h3>

        {/* Items List with Prices */}
        <div className="mb-4 space-y-2 bg-elite-cream/30 rounded-xl p-3">
          <p className="text-xs font-cabin font-semibold text-elite-black/70 mb-2">
            Items included:
          </p>
          {combo.items.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-elite-burgundy font-semibold">•</span>
                <span className="font-cabin text-elite-black/80 truncate">
                  {item.name}
                </span>
              </div>
              <span className="font-cabin text-elite-black/60 text-xs ml-2 flex-shrink-0">
                {item.price.toFixed(0)} EGP
              </span>
            </div>
          ))}
        </div>

        {/* Price Section */}
        <div className="mt-auto space-y-2 bg-white/50 rounded-xl p-4 border border-elite-burgundy/10">
          {/* Original Total */}
          <div className="flex items-center justify-between">
            <span className="font-cabin text-elite-black/70 text-sm">
              Original Total:
            </span>
            <span className="font-cabin text-elite-black/50 text-sm line-through">
              {combo.originalTotal.toFixed(0)} EGP
            </span>
          </div>
          
          {/* Deal Price */}
          <div className="flex items-center justify-between">
            <span className="font-cabin text-elite-black/70 text-sm font-semibold">
              Combo Price:
            </span>
            <span className="font-cabin text-elite-burgundy font-bold text-lg">
              {combo.dealPrice.toFixed(0)} EGP
            </span>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-elite-burgundy/20 my-2" />
          
          {/* Savings (Prominent) */}
          {combo.dealActive && combo.savings > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-cabin text-emerald-700 font-bold text-base">
                You Save:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-cabin text-emerald-700 font-bold text-base">
                  {combo.savings.toFixed(0)} EGP
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-cabin font-semibold">
                  ({combo.savingsPercent.toFixed(0)}% off)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Add Button */}
        {combo.dealActive && (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={cn(
              "w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl sm:rounded-2xl text-sm font-cabin font-bold",
              "shadow-md transition-all touch-manipulation active:scale-[0.97]",
              "min-h-[44px]",
              added
                ? "bg-emerald-500 text-white shadow-emerald-500/25"
                : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/25"
            )}
            aria-live="polite"
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added!</span>
              </>
            ) : adding ? (
              <div className="w-4 h-4 border-2 border-elite-cream border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Add Combo</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

