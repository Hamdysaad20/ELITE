"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useState } from "react";
import CartDrawer from "@/components/Cart/CartDrawer";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Explore",
    href: "/menu",
    icon: Compass,
  },
  {
    name: "Cart",
    href: "#cart",
    icon: ShoppingCart,
    isCart: true,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    requireAuth: true,
  },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { itemCount } = useLocalCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "#cart") {
      return false; // Cart is never "active"
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string, requireAuth?: boolean, isCart?: boolean) => {
    if (isCart) {
      setIsCartOpen(true);
      return;
    }
    
    if (requireAuth && status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(href)}`);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-elite-burgundy/10 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, item.requireAuth, item.isCart)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 touch-manipulation active:scale-95 min-w-[64px] relative",
                  active
                    ? "bg-elite-burgundy/10 text-elite-burgundy"
                    : "text-elite-black/50 active:bg-elite-burgundy/5"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      active && "scale-110"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-elite-burgundy rounded-full" />
                  )}
                  
                  {/* Cart Badge */}
                  {item.isCart && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-elite-burgundy text-white text-[9px] font-bold font-calistoga rounded-full w-4 h-4 flex items-center justify-center border border-white">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-cabin font-semibold transition-all duration-300",
                    active ? "font-bold" : "font-medium"
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}
