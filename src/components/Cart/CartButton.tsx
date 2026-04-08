"use client";

import { ClipboardList, ShoppingCart } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import CartDrawer from "./CartDrawer";
import { useOrdering } from "@/context/OrderingContext";
import { useCartDrawer } from "@/context/CartDrawerContext";
import { useTranslations } from "next-intl";

export default function CartButton() {
  const { itemCount } = useLocalCart();
  const { orderingEnabled } = useOrdering();
  const { isOpen, open, close } = useCartDrawer();
  const t = useTranslations("cartDrawer");

  const Icon = orderingEnabled ? ShoppingCart : ClipboardList;
  const ariaLabel = orderingEnabled ? t("aria.openCart") : t("aria.openPlan");
  const showBadge = itemCount > 0;

  return (
    <>
      <button
        onClick={open}
        className="hidden md:flex fixed bottom-6 end-6 sm:bottom-10 sm:end-10 z-40 group"
        aria-label={ariaLabel}
      >
        <div className="relative">
          {showBadge && (
            <span className="absolute -inset-2 rounded-full bg-elite-burgundy/20 animate-ping duration-1000" />
          )}
          <div className="relative bg-elite-burgundy text-elite-cream p-4 sm:p-5 rounded-full shadow-2xl border-[3px] border-elite-cream transition-all duration-300 group-hover:scale-110 group-hover:shadow-elite-burgundy/40 group-active:scale-95 flex items-center justify-center">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          {showBadge && (
            <span className="absolute -top-1 -end-1 sm:-top-2 sm:-end-2 bg-white text-elite-burgundy text-xs sm:text-sm font-bold font-calistoga rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg border-2 border-elite-burgundy animate-in zoom-in duration-300">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
      </button>

      <CartDrawer isOpen={isOpen} onClose={close} />
    </>
  );
}
