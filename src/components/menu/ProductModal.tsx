"use client";

import { useState, useEffect, useMemo } from "react";
import { Minus, Plus, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import Modal from "@/components/ui/Modal";
import { useLocalCart, LocalCartItem } from "@/hooks/useLocalCart";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { getLocalProductImageCandidates, sanitizeImages } from "@/lib/imageUtils";
import { useOrdering } from "@/context/OrderingContext";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";
import { openSupportMessenger } from "@/lib/support";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
}: ProductModalProps) {
  const { addItem } = useLocalCart();
  const { orderingEnabled, orderingMessage } = useOrdering();
  const disabledMessage = orderingMessage || ORDERING_DISABLED_MESSAGE;
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, number>
  >({});
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);

      // Initialize default options (first option for each attribute)
      const defaults: Record<string, number> = {};
      if (product.attributes) {
        Object.entries(product.attributes).forEach(([attrName, options]) => {
          if (options && options.length > 0) {
            defaults[attrName] = options[0].id;
          }
        });
      }
      setSelectedOptions(defaults);
    }
  }, [product]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;

    let price = product.price;

    // Add extra price from selected options
    if (product.attributes) {
      Object.entries(selectedOptions).forEach(([attrName, selectedId]) => {
        const options = product.attributes?.[attrName];
        const selectedOption = options?.find((opt) => opt.id === selectedId);
        if (selectedOption) {
          price += selectedOption.priceExtra;
        }
      });
    }

    return price * quantity;
  }, [product, selectedOptions, quantity]);

  const handleOptionSelect = (attrName: string, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [attrName]: optionId,
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!orderingEnabled) {
      openSupportMessenger();
      setJustAdded(true);
      setTimeout(() => {
        onClose();
        setJustAdded(false);
      }, 600);
      return;
    }

    setIsAdding(true);
    try {
      const attributes: LocalCartItem["attributes"] = {};

      // Map selected options to LocalCartItem attributes
      Object.entries(selectedOptions).forEach(([attrName, selectedId]) => {
        const optionsList = product.attributes?.[attrName];
        const selectedOption = optionsList?.find(
          (opt) => opt.id === selectedId,
        );
        if (selectedOption) {
          attributes[attrName] = [
            {
              valueId: selectedOption.id,
              valueName: selectedOption.name,
              priceExtra: selectedOption.priceExtra,
            },
          ];
        }
      });

      addItem({
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        quantity: quantity,
        attributes: attributes,
        totalPrice: totalPrice,
        image:
          getLocalProductImageCandidates(product.name)[0] ||
          sanitizeImages(product.images)[0],
      });

      setJustAdded(true);
      // Brief success feedback before closing
      setTimeout(() => {
        onClose();
        setJustAdded(false);
      }, 600);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) return null;

  const validImages = sanitizeImages(product.images);
  const localImages = getLocalProductImageCandidates(product.name);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Your Order"
      className="max-w-2xl md:max-w-4xl lg:max-w-5xl"
    >
      <div className="flex flex-col">
        <div className="p-4 pt-6 sm:p-6 sm:pt-8 lg:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Image - Optimized for mobile with fixed aspect ratio */}
            <div className="w-full md:w-2/5 flex-shrink-0">
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 p-2">
                  <div
                    className={cn(
                      "bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl transition-transform duration-500 relative overflow-hidden flex items-center justify-center w-full h-full",
                    )}
                  >
                    <ImageWithFallback
                      src={[...localImages, ...validImages]}
                      alt={product.name}
                      className="w-full h-full object-contain sm:object-cover"
                      objectFit="cover"
                      showErrorIcon={true}
                      fill={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details - Enhanced mobile layout */}
            <div className="flex-1 space-y-4 md:space-y-6">
              <div>
                <h2 className="font-calistoga text-xl sm:text-2xl md:text-3xl text-elite-black mb-2">
                  {product.name}
                </h2>
                <p className="font-cabin text-elite-black/70 text-sm sm:text-base leading-relaxed">
                  {product.description || "No description available."}
                </p>
              </div>

              {/* Attributes / Options - Enhanced touch targets */}
              {product.attributes &&
                Object.entries(product.attributes).map(
                  ([attrName, options]) => (
                    <div key={attrName} className="space-y-2 md:space-y-3">
                      <h3 className="font-cabin font-semibold text-elite-black text-xs sm:text-sm uppercase tracking-wider">
                        {attrName}
                      </h3>
                      <div className="flex flex-wrap gap-2 md:gap-2.5">
                        {options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() =>
                              handleOptionSelect(attrName, option.id)
                            }
                            className={cn(
                              "px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all border min-w-[72px] sm:min-w-[80px] touch-manipulation active:scale-95",
                              selectedOptions[attrName] === option.id
                                ? "bg-elite-burgundy text-elite-cream border-elite-burgundy shadow-lg scale-105"
                                : "bg-white text-elite-black border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:bg-elite-cream/20 active:bg-elite-cream/30",
                            )}
                          >
                            {option.name}
                            {option.priceExtra > 0 && (
                              <span className="ml-1 opacity-80 text-xs">
                                (+{option.priceExtra})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ),
                )}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar (price + quantity + action) */}
        <div className="sticky bottom-0 flex-shrink-0 bg-white border-t border-elite-burgundy/10 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-cabin text-xs sm:text-sm text-elite-black/60">
                Total
              </p>
              <p className="font-calistoga text-elite-burgundy text-lg sm:text-xl tabular-nums truncate">
                {totalPrice.toFixed(2)} EGP
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 bg-elite-cream/50 rounded-xl p-1.5 flex-shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 hover:bg-white active:bg-white rounded-lg transition-colors text-elite-burgundy touch-manipulation active:scale-90 disabled:opacity-30 flex items-center justify-center"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="font-calistoga text-base sm:text-lg w-10 text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 hover:bg-white active:bg-white rounded-lg transition-colors text-elite-burgundy touch-manipulation active:scale-90 flex items-center justify-center"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {!orderingEnabled && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <p className="font-cabin text-amber-900 text-sm">
                {disabledMessage} Tap notify to get updates.
              </p>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || justAdded}
            className={cn(
              "mt-3 w-full py-4 rounded-2xl font-cabin font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3 touch-manipulation min-h-[56px] active:scale-[0.98]",
              justAdded
                ? "bg-emerald-500 text-white shadow-emerald-500/25"
                : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/25 disabled:opacity-70",
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>{orderingEnabled ? "Added!" : "Notified!"}</span>
              </>
            ) : isAdding ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-elite-cream border-t-transparent rounded-full animate-spin" />
                <span>{orderingEnabled ? "Adding..." : "Opening..."}</span>
              </div>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {orderingEnabled ? "Add to Order" : "Notify me"} • EGP{" "}
                  {totalPrice.toFixed(2)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
