"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ShoppingCart,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { getLocalProductImageCandidates, sanitizeImages } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { useLocalCart } from "@/hooks/useLocalCart";
import type { ComboDeal } from "@/types/deals";
import { useFormatter, useTranslations } from "next-intl";

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
  const t = useTranslations("comboDeal");
  const format = useFormatter();
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
  const validImages = sanitizeImages(
    combo.items.map((item) => item.image).filter(Boolean) as string[],
  );

  const nextItem = () => {
    if (hasMultipleItems) {
      setCurrentIndex((prev) => (prev + 1) % combo.items.length);
    }
  };

  const prevItem = () => {
    if (hasMultipleItems) {
      setCurrentIndex(
        (prev) => (prev - 1 + combo.items.length) % combo.items.length,
      );
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
            image:
              getLocalProductImageCandidates(item.name)[0] ||
              item.image,
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

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    });

  return (
    <div
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl overflow-hidden",
        // Premium multi-layer shadows
        "shadow-[0_4px_12px_rgba(139,0,0,0.1),0_2px_8px_rgba(139,0,0,0.08)]",
        "border border-elite-burgundy/10",
        "transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        // Enhanced hover effects
        "md:hover:shadow-[0_12px_32px_rgba(139,0,0,0.15),0_4px_16px_rgba(139,0,0,0.1)]",
        "md:hover:border-elite-burgundy/20",
        "md:hover:-translate-y-2",
        "md:hover:scale-[1.02]",
        !combo.dealActive && "opacity-60",
        className,
      )}
    >
      {/* Enhanced Image Slider */}
      <div className="relative h-52 sm:h-64 bg-gradient-to-b from-elite-cream/60 to-elite-burgundy/8 overflow-hidden">
        {validImages.length > 0 ? (
          <>
            <div className="relative w-full h-full">
              <ImageWithFallback
                src={
                  validImages[currentIndex % validImages.length] ||
                  validImages[0]
                }
                alt={currentItem.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                fill={true}
                objectFit="cover"
                showErrorIcon={true}
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-elite-burgundy/10 to-transparent" />
            </div>

            {/* Enhanced Slider Controls */}
            {hasMultipleItems && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevItem();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-2 shadow-lg border border-elite-burgundy/10 hover:border-elite-burgundy/20 transition-all hover:scale-110 z-10"
                  aria-label={t("controls.previous")}
                >
                  <ChevronLeft className="w-5 h-5 text-elite-burgundy" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextItem();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-2 shadow-lg border border-elite-burgundy/10 hover:border-elite-burgundy/20 transition-all hover:scale-110 z-10"
                  aria-label={t("controls.next")}
                >
                  <ChevronRight className="w-5 h-5 text-elite-burgundy" />
                </button>

                {/* Enhanced Dots Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-elite-burgundy/10">
                  {combo.items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        idx === currentIndex
                          ? "bg-elite-burgundy w-6 h-2 shadow-sm"
                          : "bg-elite-burgundy/30 hover:bg-elite-burgundy/50 w-2 h-2",
                      )}
                      aria-label={t("controls.goTo", { index: idx + 1 })}
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

      {/* Enhanced Content */}
      <div className="p-5 sm:p-6 flex flex-col h-full">
        <h3
          className={cn(
            "font-calistoga text-elite-black font-bold mb-3 line-clamp-2",
            getTitleSize(),
          )}
        >
          {combo.name}
        </h3>

        {/* Enhanced Items List with Premium Card Style */}
        <div className="mb-5 space-y-2.5 bg-gradient-to-br from-elite-cream/40 to-elite-cream/20 rounded-2xl p-4 border border-elite-burgundy/10 shadow-sm">
          <p className="text-xs font-cabin font-bold text-elite-black/80 mb-3 uppercase tracking-wide">
            Items included:
          </p>
          <div className="space-y-2">
            {combo.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white/60 rounded-xl p-2.5 border border-elite-burgundy/5 hover:bg-white/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold font-cabin">
                      {idx + 1}
                    </span>
                  </div>
                  <span className="font-cabin text-elite-black/90 font-medium truncate text-sm">
                    {item.name}
                  </span>
                </div>
                <span className="font-cabin text-elite-burgundy font-semibold text-sm ml-3 flex-shrink-0">
                  {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Price Section with Premium Styling */}
        <div className="mt-auto space-y-3 bg-gradient-to-br from-white to-elite-cream/30 rounded-2xl p-5 border-2 border-elite-burgundy/15 shadow-md">
          {/* Original Total */}
          <div className="flex items-center justify-between pb-2 border-b border-elite-burgundy/10">
            <span className="font-cabin text-elite-black/60 text-sm font-medium">
              {t("pricing.originalTotal")}
            </span>
            <span className="font-cabin text-elite-black/40 text-sm line-through decoration-elite-black/40">
              {formatPrice(combo.originalTotal)}
            </span>
          </div>

          {/* Deal Price - Enhanced */}
          <div className="flex items-center justify-between py-2">
            <span className="font-cabin text-elite-black/80 text-sm font-bold">
              {t("pricing.comboPrice")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-calistoga text-elite-burgundy font-bold text-2xl sm:text-3xl bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy bg-clip-text text-transparent">
                {formatPrice(combo.dealPrice)}
              </span>
            </div>
          </div>

          {/* Enhanced Savings (Very Prominent) */}
          {combo.dealActive && combo.savings > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3.5 border-2 border-emerald-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-cabin text-emerald-800 font-bold text-sm uppercase tracking-wide">
                  {t("pricing.youSave")}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="font-calistoga text-emerald-700 font-bold text-lg">
                    {formatPrice(combo.savings)}
                  </span>
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-cabin font-bold shadow-md">
                    {t("pricing.percentOff", {
                      percent: combo.savingsPercent.toFixed(0),
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Add Button */}
        {combo.dealActive && (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={cn(
              "w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl sm:rounded-2xl text-sm font-cabin font-bold",
              "transition-all touch-manipulation active:scale-[0.97]",
              "min-h-[48px]",
              added
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                : "bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream shadow-lg shadow-elite-burgundy/25 hover:shadow-xl hover:shadow-elite-burgundy/35 hover:scale-[1.02]",
            )}
            aria-live="polite"
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t("actions.added")}</span>
              </>
            ) : adding ? (
              <div className="w-4 h-4 border-2 border-elite-cream border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>{t("actions.addCombo")}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
