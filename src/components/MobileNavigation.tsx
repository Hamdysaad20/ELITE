"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useLocalCart } from "@/hooks/useLocalCart";
import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || optimisticPath === "/";
    }
    if (href === "#cart") {
      return false; // Cart is never "active"
    }
    return pathname.startsWith(href) || optimisticPath === href;
  };

  const handleNavigation = (href: string, requireAuth?: boolean, isCart?: boolean) => {
    if (isCart) {
      setIsCartOpen(true);
      return;
    }
    
    if (requireAuth && status === "unauthenticated") {
      startTransition(() => {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(href)}`);
      });
      return;
    }

    // Optimistic UI update
    setOptimisticPath(href);
    
    startTransition(() => {
      router.push(href);
      // Reset optimistic state after navigation
      setTimeout(() => setOptimisticPath(null), 300);
    });
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 safe-area-inset-bottom">
        <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-[0_-8px_24px_rgba(139,0,0,0.12),0_4px_12px_rgba(139,0,0,0.08)] border border-elite-burgundy/10">
          <div className="flex items-center justify-around px-2 py-2.5 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, item.requireAuth, item.isCart)}
                disabled={isPending && optimisticPath === item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-full transition-all duration-500 ease-out touch-manipulation will-change-transform",
                  "active:scale-90",
                  active
                    ? "bg-elite-burgundy text-white shadow-lg shadow-elite-burgundy/30 scale-105"
                    : "text-elite-black/60 hover:text-elite-burgundy hover:bg-elite-burgundy/5 active:bg-elite-burgundy/10",
                  "min-w-[72px] flex-1 max-w-[90px]"
                )}
                style={{
                  transform: active ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <div className="relative">
                  {/* Icon with smooth transition */}
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-500 ease-out will-change-transform",
                      active && "scale-110 drop-shadow-sm"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  
                  {/* Active indicator dot */}
                  {active && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-in zoom-in duration-300" />
                  )}
                  
                  {/* Cart Badge with animation */}
                  {item.isCart && itemCount > 0 && (
                    <span 
                      className={cn(
                        "absolute -top-1.5 -right-2 text-[9px] font-bold font-calistoga rounded-full w-4 h-4 flex items-center justify-center border transition-all duration-300 ease-out animate-in zoom-in",
                        active 
                          ? "bg-white text-elite-burgundy border-white shadow-lg" 
                          : "bg-elite-burgundy text-white border-elite-burgundy"
                      )}
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>

                {/* Label with smooth fade */}
                <span
                  className={cn(
                    "text-[10px] font-cabin transition-all duration-500 ease-out leading-tight",
                    active ? "font-bold opacity-100" : "font-medium opacity-80"
                  )}
                >
                  {item.name}
                </span>

                {/* Loading indicator */}
                {isPending && optimisticPath === item.href && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full backdrop-blur-sm">
                    <div className="w-4 h-4 border-2 border-elite-burgundy border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
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
