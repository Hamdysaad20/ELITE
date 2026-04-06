"use client";

import { X, ShoppingCart, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useSession } from "next-auth/react";
import { useEffect, useState, useTransition, useOptimistic } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  getFallbackImage,
  getLocalProductImageCandidates,
  sanitizeImages,
} from "@/lib/imageUtils";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname } from "@/i18n/routing";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";
import { useOrdering } from "@/context/OrderingContext";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";
import { openSupportMessenger } from "@/lib/support";
import { authFetch } from "@/lib/auth/apiClient";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations("cartDrawer");
  const format = useFormatter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const localizedRouter = useLocalizedRouter();
  const { items, removeItem, updateQuantity, subtotal, tax, total, itemCount } =
    useLocalCart();
  const { status } = useSession();
  const { orderingEnabled, orderingMessage } = useOrdering();
  const [isPending, startTransition] = useTransition();
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkoutDisabledMessage = orderingMessage || ORDERING_DISABLED_MESSAGE;

  const itemCountLabel = `${itemCount} ${
    itemCount === 1
      ? orderingEnabled
        ? "item"
        : "saved item"
      : orderingEnabled
        ? "items"
        : "saved items"
  }`;
  const cartTitle = orderingEnabled ? "Shopping Cart" : "Saved Items";

  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    // Prevent background scrolling while the drawer is open
    body.style.overflow = "hidden";

    // Avoid layout shift when scrollbar disappears
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Optimistic cart state
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (
      state,
      optimisticValue: {
        action: "remove" | "update";
        id: string;
        quantity?: number;
      },
    ) => {
      if (optimisticValue.action === "remove") {
        return state.filter((item) => item.id !== optimisticValue.id);
      }
      if (
        optimisticValue.action === "update" &&
        optimisticValue.quantity !== undefined
      ) {
        return state.map((item) =>
          item.id === optimisticValue.id
            ? { ...item, quantity: optimisticValue.quantity as number }
            : item,
        );
      }
      return state;
    },
  );

  const handleRemoveItem = (id: string) => {
    setPendingItems((prev) => new Set(prev).add(id));
    startTransition(() => {
      setOptimisticItems({ action: "remove", id });
      removeItem(id);
      setTimeout(() => {
        setPendingItems((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    startTransition(() => {
      setOptimisticItems({ action: "update", id, quantity });
      updateQuantity(id, quantity);
    });
  };

  const handleCheckout = () => {
    if (!orderingEnabled) return;
    setIsCheckingOut(true);
    const orderPath = addLocaleToPathname("/order", locale);
    const signInPath = addLocaleToPathname("/auth/signin", locale);
    if (status === "unauthenticated") {
      // Redirect to login with callback to checkout
      localizedRouter.push(
        `${signInPath}?callbackUrl=${encodeURIComponent(orderPath)}`,
      );
    } else {
      // Proceed to checkout
      localizedRouter.push(orderPath);
    }
    setTimeout(() => {
      onClose();
      setIsCheckingOut(false);
    }, 300);
  };

  const handleNotify = async () => {
    if (status !== "authenticated") return;

    try {
      // Get productIds from cart items
      const productIds = items.map((item) => item.productId);

      const response = await authFetch("/api/notify/item-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      });

      if (response.ok) {
        // Success - close drawer
        onClose();
      } else {
        console.error("Failed to register for notifications");
      }
    } catch (error) {
      console.error("Error registering for notifications:", error);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={orderingEnabled ? "Shopping cart" : "Saved items"}
        className={`fixed right-0 top-0 h-full w-full sm:w-[min(480px,calc(100vw-2rem))] md:w-[min(540px,calc(100vw-2rem))] lg:w-[600px] xl:w-[640px] bg-elite-cream shadow-2xl z-[70] transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header - Enhanced touch targets */}
          <div className="bg-elite-burgundy text-elite-cream p-4 sm:p-5 md:p-6 lg:p-8 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-3.5 lg:gap-4 min-w-0 flex-1">
                <div className="bg-elite-cream/10 p-2.5 sm:p-3 lg:p-3.5 rounded-2xl flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-calistoga text-xl sm:text-2xl lg:text-3xl leading-tight truncate">
                    {cartTitle}
                  </h2>
                  <p className="font-cabin text-elite-cream/80 text-sm sm:text-base mt-0.5 truncate tabular-nums min-h-[1.25rem] sm:min-h-[1.5rem]">
                    <span
                      className={itemCount > 0 ? "opacity-100" : "opacity-0"}
                    >
                      {itemCountLabel}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-elite-cream/20 active:bg-elite-cream/30 rounded-full transition-all duration-300 active:scale-90 touch-manipulation group flex-shrink-0 ml-2 w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center"
                aria-label={t("aria.close")}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
          {/* Cart Items - Enhanced scrolling */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8 overscroll-contain">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-elite-burgundy/5 p-8 sm:p-10 lg:p-12 rounded-full mb-6 lg:mb-8">
                  <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-elite-burgundy/30" />
                </div>
                <h3 className="font-calistoga text-elite-burgundy text-lg sm:text-xl lg:text-2xl mb-2 lg:mb-3">
                  {orderingEnabled
                    ? "Your cart is empty"
                    : "No saved items yet"}
                </h3>
                <p className="font-cabin text-elite-black/60 text-sm sm:text-base lg:text-lg mb-6 lg:mb-8 max-w-sm">
                  {orderingEnabled
                    ? "Start adding some delicious items to your order!"
                    : "Ordering is paused. Tap Get updates to stay in the loop."}
                </p>
                <button
                  onClick={onClose}
                  className="bg-elite-burgundy text-elite-cream px-10 sm:px-12 lg:px-14 py-4 sm:py-4.5 lg:py-5 rounded-full font-cabin font-bold text-base lg:text-lg hover:shadow-xl hover:scale-105 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-elite-burgundy/25 touch-manipulation min-h-[52px] lg:min-h-[60px]"
                >
                  {t("empty.cta")}
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {optimisticItems.map((item) => {
                  const isItemPending = pendingItems.has(item.id);
                  const imageCandidates = sanitizeImages([
                    ...getLocalProductImageCandidates(item.name),
                    item.image,
                  ]);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-elite-burgundy/10 active:scale-[0.99] ${isItemPending ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      <div className="flex gap-3 sm:gap-4 relative">
                        {/* Loading overlay */}
                        {isItemPending && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-2xl z-10">
                            <div className="w-6 h-6 border-3 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
                          </div>
                        )}

                        {/* Image - Optimized sizing with aspect ratio */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-xl lg:rounded-2xl overflow-hidden bg-elite-cream flex-shrink-0 ring-2 ring-elite-burgundy/5 aspect-square">
                          <ImageWithFallback
                            src={imageCandidates}
                            alt={item.name}
                            fallbackSrc={getFallbackImage("product")}
                            width={112}
                            height={112}
                            objectFit="cover"
                            showErrorIcon={false}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-calistoga text-elite-burgundy text-base sm:text-lg lg:text-xl line-clamp-2 pr-1">
                              {item.name}
                            </h4>

                            {/* Remove Button - Enhanced for mobile */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isItemPending}
                              className="flex-shrink-0 p-2 lg:p-2.5 text-red-500 hover:text-white hover:bg-red-500 active:bg-red-600 rounded-full transition-all duration-300 active:scale-90 touch-manipulation group shadow-sm hover:shadow-lg w-11 h-11 lg:w-11 lg:h-11 flex items-center justify-center"
                              aria-label={t("aria.removeItem")}
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>

                          {/* Attributes */}
                          {Object.entries(item.attributes).length > 0 && (
                            <div className="space-y-1 mb-2 lg:mb-3">
                              {Object.entries(item.attributes).map(
                                ([attrName, values]) => (
                                  <p
                                    key={attrName}
                                    className="font-cabin text-elite-black/60 text-xs sm:text-sm leading-snug"
                                  >
                                    <span className="font-semibold text-elite-burgundy/70">
                                      {attrName}:
                                    </span>{" "}
                                    {values.map((v) => v.valueName).join(", ")}
                                    {values.some((v) => v.priceExtra > 0) && (
                                      <span className="text-elite-burgundy font-medium">
                                        {" "}
                                        {t("priceExtra", {
                                          amount: formatCurrency(
                                            values.reduce(
                                              (sum, v) => sum + v.priceExtra,
                                              0,
                                            ),
                                          ),
                                        })}
                                      </span>
                                    )}
                                  </p>
                                ),
                              )}
                            </div>
                          )}

                          {/* Quantity and Price */}
                          <div className="flex items-end justify-between mt-3 gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 bg-elite-cream/50 rounded-full p-1.5 sm:p-2 border border-elite-burgundy/10 shadow-sm">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="text-elite-burgundy hover:bg-elite-burgundy/10 active:bg-elite-burgundy/20 rounded-full transition-all duration-300 active:scale-90 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed w-11 h-11 flex items-center justify-center"
                                  disabled={item.quantity <= 1 || isItemPending}
                                  aria-label={t("aria.decrease")}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-cabin font-bold text-elite-burgundy text-sm sm:text-base min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="text-elite-burgundy hover:bg-elite-burgundy/10 active:bg-elite-burgundy/20 rounded-full transition-all duration-300 active:scale-90 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed w-11 h-11 flex items-center justify-center"
                                  disabled={
                                    item.quantity >= 50 || isItemPending
                                  }
                                  aria-label={t("aria.increase")}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="font-cabin font-bold text-elite-burgundy text-base sm:text-lg lg:text-xl">
                                {formatCurrency(item.totalPrice)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="font-cabin text-elite-black/50 text-xs sm:text-sm">
                                  {formatCurrency(
                                    item.totalPrice / item.quantity,
                                  )}{" "}
                                  {t("each")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer (Totals and Checkout) - Enhanced mobile padding */}
          {items.length > 0 && (
            <div className="border-t-2 border-elite-burgundy/10 bg-white p-4 sm:p-5 md:p-6 lg:p-8 flex-shrink-0 safe-area-inset-bottom">
              {(() => {
                // Only show a detailed breakdown if we introduce additional pricing components in the future
                // (e.g., taxes, fees, discounts). For now, customers pay the item price as-is.
                const showBreakdown = tax > 0 || subtotal !== total;
                return (
                  <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6 lg:mb-8">
                    {showBreakdown && (
                      <div className="flex justify-between font-cabin text-elite-black/70 text-sm sm:text-base lg:text-lg">
                        <span>{t("summary.subtotal")}</span>
                        <span className="font-semibold">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    )}
                    <div className="border-t-2 border-elite-burgundy/20 pt-2 sm:pt-2.5 flex justify-between font-calistoga text-elite-burgundy text-xl sm:text-2xl lg:text-3xl">
                      <span>{t("summary.total")}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                );
              })()}

              {orderingEnabled ? (
                <>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-elite-burgundy text-elite-cream py-4.5 sm:py-5 lg:py-6 rounded-full font-cabin font-bold text-base sm:text-lg lg:text-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 shadow-xl shadow-elite-burgundy/30 hover:shadow-2xl flex items-center justify-center gap-2.5 sm:gap-3 touch-manipulation min-h-[56px] sm:min-h-[60px] lg:min-h-[64px] group disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="w-5 h-5 border-3 border-elite-cream/30 border-t-elite-cream rounded-full animate-spin" />
                        <span>{t("actions.processing")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("actions.checkout")}</span>
                        <ArrowRight
                          className={cn(
                            "w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300",
                            isRTL
                              ? "group-hover:-translate-x-1 rotate-180"
                              : "group-hover:translate-x-1",
                          )}
                        />
                      </>
                    )}
                  </button>
                  {status === "unauthenticated" && (
                    <p className="text-center font-cabin text-elite-black/50 text-xs sm:text-sm lg:text-base mt-3 lg:mt-4">
                      {t("actions.signInNotice")}
                    </p>
                  )}
                </>
              ) : status === "authenticated" ? (
                <>
                  <button
                    onClick={handleNotify}
                    className="w-full bg-elite-burgundy text-elite-cream py-4.5 sm:py-5 lg:py-6 rounded-full font-cabin font-bold text-base sm:text-lg lg:text-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 shadow-xl shadow-elite-burgundy/30 hover:shadow-2xl flex items-center justify-center gap-2.5 sm:gap-3 touch-manipulation min-h-[56px] sm:min-h-[60px] lg:min-h-[64px] group"
                  >
                    <span>Notify me when available</span>
                  </button>
                  <p className="text-center font-cabin text-elite-black/60 text-xs sm:text-sm lg:text-base mt-3 lg:mt-4">
                    Ordering is temporarily paused. We'll notify you as soon as
                    your saved items are available again.
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <p className="font-cabin text-elite-black/70 text-sm sm:text-base lg:text-lg mb-2">
                    Online ordering is currently paused
                  </p>
                  <p className="font-cabin text-elite-black/60 text-xs sm:text-sm lg:text-base">
                    We're putting the final touches on the experience. Ordering
                    will be available very soon.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
