"use client";

import { useState, useEffect, useMemo } from "react";
import { Minus, Plus, ShoppingBag, Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/hooks/useProducts";
import Modal from "@/components/ui/Modal";
import { useLocalCart, LocalCartItem } from "@/hooks/useLocalCart";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  getLocalProductImageCandidates,
  sanitizeImages,
} from "@/lib/imageUtils";
import { useFormatter, useTranslations } from "next-intl";
import { useOrdering } from "@/context/OrderingContext";

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
  const router = useRouter();
  const t = useTranslations("productModal");
  const format = useFormatter();
  const { addItem } = useLocalCart();
  const { orderingEnabled } = useOrdering();
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

  const formatPrice = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    });

  const handleOptionSelect = (attrName: string, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [attrName]: optionId,
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!orderingEnabled) {
      onClose();
      router.push(`/products/${product.id}`);
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
      title={t("title")}
      className="md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
    >
      <div className="flex flex-col">
        {/* ── Content ── */}
        <div className="p-4 pt-5 sm:p-6 md:p-8 lg:p-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 lg:gap-12">
            {/* Image */}
            <div className="w-full md:w-[42%] lg:w-[38%] flex-shrink-0">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-elite-burgundy/6 to-elite-burgundy/14 shadow-[0_8px_32px_rgba(139,38,53,0.10)]">
                <ImageWithFallback
                  src={[...validImages, ...localImages]}
                  alt={product.name}
                  className="w-full h-full object-contain md:object-cover"
                  objectFit="cover"
                  showErrorIcon={true}
                  fill={true}
                  quality={95}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-5 md:space-y-6">
              <div>
                <h2 className="font-calistoga text-2xl sm:text-3xl md:text-[1.9rem] text-elite-black leading-tight mb-2.5">
                  {product.name}
                </h2>
                <p className="font-cabin text-elite-black/65 text-sm sm:text-base leading-relaxed">
                  {product.description || t("noDescription")}
                </p>
              </div>

              {/* Attributes */}
              {product.attributes &&
                Object.entries(product.attributes).map(
                  ([attrName, options]) => (
                    <div key={attrName} className="space-y-2.5">
                      <h3 className="font-cabin font-semibold text-elite-black text-[11px] uppercase tracking-[0.12em]">
                        {attrName}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() =>
                              handleOptionSelect(attrName, option.id)
                            }
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border touch-manipulation active:scale-95",
                              selectedOptions[attrName] === option.id
                                ? "bg-elite-burgundy text-elite-cream border-elite-burgundy shadow-md"
                                : "bg-elite-cream/50 text-elite-black border-elite-burgundy/12 hover:border-elite-burgundy/35 hover:bg-elite-cream",
                            )}
                          >
                            {option.name}
                            {option.priceExtra > 0 && (
                              <span className="ms-1 opacity-70 text-xs">
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

        {/* ── Sticky bottom bar ── */}
        <div className="sticky bottom-0 flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-elite-burgundy/10 px-4 py-4 sm:px-6 md:px-8 lg:px-10 md:py-5">
          <div className="flex items-center justify-between gap-4 mb-3 md:mb-4">
            {/* Price */}
            <div className="min-w-0">
              <p className="font-cabin text-xs text-elite-black/50 mb-0.5">
                {t("total")}
              </p>
              <p className="font-calistoga text-elite-burgundy text-xl md:text-2xl tabular-nums">
                {formatPrice(totalPrice)}
              </p>
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center gap-1 bg-elite-cream/60 rounded-2xl p-1 flex-shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 md:w-11 md:h-11 hover:bg-white active:bg-white rounded-xl transition-colors text-elite-burgundy touch-manipulation active:scale-90 disabled:opacity-30 flex items-center justify-center"
                disabled={quantity <= 1}
                aria-label={t("decreaseQuantity")}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-calistoga text-lg w-9 text-center tabular-nums text-elite-black">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 md:w-11 md:h-11 hover:bg-white active:bg-white rounded-xl transition-colors text-elite-burgundy touch-manipulation active:scale-90 flex items-center justify-center"
                aria-label={t("increaseQuantity")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding || justAdded}
            className={cn(
              "w-full py-4 md:py-[1.1rem] rounded-2xl font-cabin font-bold text-base shadow-lg transition-all flex items-center justify-center gap-3 touch-manipulation min-h-[54px] active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-xl",
              justAdded
                ? "bg-emerald-500 text-white shadow-emerald-500/25"
                : "bg-elite-burgundy text-elite-cream shadow-elite-burgundy/25 disabled:opacity-70",
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>{t("added")}</span>
              </>
            ) : isAdding ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-elite-cream border-t-transparent rounded-full animate-spin" />
                <span>{t("adding")}</span>
              </div>
            ) : orderingEnabled ? (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {t("addToOrder", { total: formatPrice(totalPrice) })}
                </span>
              </>
            ) : (
              <>
                <span>{t("seeDetails")}</span>
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
