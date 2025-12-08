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
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream p-3.5 sm:p-4 lg:p-5 rounded-full shadow-2xl hover:shadow-elite-burgundy/50 hover:scale-110 active:scale-95 transition-all duration-300 z-30 group touch-manipulation ring-2 ring-elite-cream/20 hover:ring-elite-cream/40"
        aria-label="Open cart"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
          {itemCount > 0 && (
            <>
              {/* Badge */}
              <span className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 bg-red-500 text-white text-xs lg:text-sm font-bold rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
              
              {/* Pulse ring animation */}
              <span className="absolute inset-0 rounded-full bg-elite-burgundy animate-ping opacity-20"></span>
            </>
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
