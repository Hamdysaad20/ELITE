"use client";

import { useState, useEffect, useMemo } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import Modal from "@/components/ui/Modal";
import { useLocalCart, LocalCartItem } from "@/hooks/useLocalCart";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { sanitizeImages } from "@/lib/imageUtils";

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
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);

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
        const selectedOption = options?.find(opt => opt.id === selectedId);
        if (selectedOption) {
          price += selectedOption.priceExtra;
        }
      });
    }
    
    return price * quantity;
  }, [product, selectedOptions, quantity]);

  const handleOptionSelect = (attrName: string, optionId: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [attrName]: optionId
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    try {
      const attributes: LocalCartItem['attributes'] = {};
      
      // Map selected options to LocalCartItem attributes
      Object.entries(selectedOptions).forEach(([attrName, selectedId]) => {
        const optionsList = product.attributes?.[attrName];
        const selectedOption = optionsList?.find(opt => opt.id === selectedId);
        if (selectedOption) {
          attributes[attrName] = [{
            valueId: selectedOption.id,
            valueName: selectedOption.name,
            priceExtra: selectedOption.priceExtra
          }];
        }
      });

      addItem({
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        quantity: quantity,
        attributes: attributes,
        totalPrice: totalPrice,
        image: sanitizeImages(product.images)[0]
      });

      onClose();
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) return null;

  const validImages = sanitizeImages(product.images);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Your Order"
      className="max-w-2xl md:max-w-3xl"
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Image - Optimized for mobile */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="relative w-full aspect-square md:pt-[100%] md:aspect-auto">
              <div className="md:absolute md:inset-0 p-2">
                <div
                  className={cn(
                    "bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl transition-transform duration-500 relative overflow-hidden flex items-center justify-center w-full h-full"
                  )}
                >
                  <ImageWithFallback
                    src={validImages}
                    alt={product.name}
                    className="w-full h-full object-cover"
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
            {product.attributes && Object.entries(product.attributes).map(([attrName, options]) => (
              <div key={attrName} className="space-y-2 md:space-y-3">
                <h3 className="font-cabin font-semibold text-elite-black text-xs sm:text-sm uppercase tracking-wider">
                  {attrName}
                </h3>
                <div className="flex flex-wrap gap-2 md:gap-2.5">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(attrName, option.id)}
                      className={cn(
                        "px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all border min-w-[72px] sm:min-w-[80px] touch-manipulation active:scale-95",
                        selectedOptions[attrName] === option.id
                          ? "bg-elite-burgundy text-elite-cream border-elite-burgundy shadow-lg scale-105"
                          : "bg-white text-elite-black border-elite-burgundy/10 hover:border-elite-burgundy/30 hover:bg-elite-cream/20 active:bg-elite-cream/30"
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
            ))}

            {/* Quantity & Add Button - Mobile optimized */}
            <div className="pt-4 md:pt-6 border-t border-elite-burgundy/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-cabin font-semibold text-elite-black text-sm sm:text-base">Quantity</span>
                <div className="flex items-center gap-2 sm:gap-3 bg-elite-cream/50 rounded-xl p-1.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 sm:p-2.5 hover:bg-white active:bg-white rounded-lg transition-colors text-elite-burgundy touch-manipulation active:scale-90 disabled:opacity-30"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="font-calistoga text-base sm:text-lg w-10 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 sm:p-2.5 hover:bg-white active:bg-white rounded-lg transition-colors text-elite-burgundy touch-manipulation active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full bg-elite-burgundy text-elite-cream py-4 sm:py-5 rounded-xl font-cabin font-bold text-base sm:text-lg shadow-lg hover:bg-elite-dark-burgundy hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation min-h-[56px]"
              >
                {isAdding ? (
                  <span className="animate-pulse">Adding to Order...</span>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Add to Order — {totalPrice.toFixed(2)} EGP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
