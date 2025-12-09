"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useLocalCart } from "@/hooks/useLocalCart";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { itemCount } = useLocalCart();

  return (
    <>
      {/* Floating Cart Button - Hidden on mobile (we have bottom nav) */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-40 group"
        aria-label="Open cart"
      >
        <div className="relative">
          {/* Ping animation for active state */}
          {itemCount > 0 && (
            <span className="absolute -inset-2 rounded-full bg-elite-burgundy/20 animate-ping duration-1000" />
          )}

          {/* Button */}
          <div className="relative bg-elite-burgundy text-elite-cream p-4 sm:p-5 rounded-full shadow-2xl border-[3px] border-elite-cream transition-all duration-300 group-hover:scale-110 group-hover:shadow-elite-burgundy/40 group-active:scale-95 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>

          {/* Badge */}
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-white text-elite-burgundy text-xs sm:text-sm font-bold font-calistoga rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg border-2 border-elite-burgundy animate-in zoom-in duration-300">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
      </button>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
}
