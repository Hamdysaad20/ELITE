"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
  transparent?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export default function MobileHeader({
  title,
  showBack = true,
  onBack,
  className,
  transparent = false,
  showMenu = false,
  onMenuClick,
}: MobileHeaderProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-out touch-manipulation px-4 pt-3 pb-2",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between h-12 px-3 rounded-full transition-all duration-500 ease-out shadow-lg",
          transparent && !isScrolled
            ? "bg-elite-cream/80 backdrop-blur-xl border-2 border-elite-burgundy/20 shadow-elite-burgundy/10"
            : "bg-elite-cream/95 backdrop-blur-xl border-2 border-elite-burgundy/30 shadow-elite-burgundy/20"
        )}
      >
        {/* Left Side - Back Button */}
        <div className="flex items-center min-w-[44px]">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full bg-elite-burgundy/10 hover:bg-elite-burgundy/20 active:bg-elite-burgundy/30 active:scale-90 transition-all duration-200 touch-manipulation group"
              aria-label="Go back"
            >
              <ArrowLeft 
                className="w-5 h-5 text-elite-burgundy group-active:text-elite-dark-burgundy transition-colors" 
                strokeWidth={2.5} 
              />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center px-3">
          {title && (
            <h1
              className={cn(
                "font-calistoga text-base truncate transition-all duration-500",
                transparent && !isScrolled 
                  ? "text-elite-burgundy opacity-90" 
                  : "text-elite-burgundy opacity-100"
              )}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right Side - Menu Button */}
        <div className="flex items-center min-w-[44px] justify-end">
          {showMenu ? (
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-9 h-9 -mr-1 rounded-full bg-elite-burgundy/10 hover:bg-elite-burgundy/20 active:bg-elite-burgundy/30 active:scale-90 transition-all duration-200 touch-manipulation group"
              aria-label="Open menu"
            >
              <Menu 
                className="w-5 h-5 text-elite-burgundy group-active:text-elite-dark-burgundy transition-colors" 
                strokeWidth={2.5} 
              />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>
    </header>
  );
}
