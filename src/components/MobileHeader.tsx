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
      setIsScrolled(window.scrollY > 10);
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
        "md:hidden fixed top-0 left-0 right-0 z-40 transition-all duration-300 touch-manipulation",
        transparent && !isScrolled
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 safe-area-inset-top">
        {/* Left Side - Back Button */}
        <div className="flex items-center min-w-[44px]">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:bg-gray-100 active:scale-95 transition-all touch-manipulation"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-elite-burgundy" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center px-2">
          {title && (
            <h1
              className={cn(
                "font-playfair font-bold text-lg truncate transition-opacity duration-300",
                transparent && !isScrolled ? "text-white" : "text-elite-black"
              )}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right Side - Menu Button */}
        <div className="flex items-center min-w-[44px] justify-end">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full active:bg-gray-100 active:scale-95 transition-all touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-elite-burgundy" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
