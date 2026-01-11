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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detect reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionHandler);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      motionQuery.removeEventListener("change", motionHandler);
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Adaptive animation classes
  const animDuration = prefersReducedMotion ? "duration-100" : "duration-300";

  return (
    <header
      className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-40 touch-manipulation",
        "px-3 pt-2 pb-1.5",
        "transition-all",
        animDuration,
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center h-[52px] px-1.5 rounded-[26px] transition-all",
          animDuration,
          transparent && !isScrolled
            ? "bg-elite-cream/85 backdrop-blur-xl border border-elite-burgundy/15 shadow-sm shadow-elite-burgundy/5"
            : "bg-elite-cream/95 backdrop-blur-xl border border-elite-burgundy/20 shadow-md shadow-elite-burgundy/10",
        )}
      >
        {/* Left Side - Back Button - Properly positioned with consistent spacing */}
        <div className="flex items-center justify-start w-[52px] flex-shrink-0">
          {showBack && (
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                "bg-elite-burgundy/8 active:bg-elite-burgundy/20",
                "active:scale-95 touch-manipulation",
                "transition-all",
                animDuration,
              )}
              aria-label="Go back"
            >
              <ArrowLeft
                className="w-[18px] h-[18px] text-elite-burgundy"
                strokeWidth={2.5}
              />
            </button>
          )}
        </div>

        {/* Center - Title with flex grow */}
        <div className="flex-1 text-center px-2 min-w-0">
          {title && (
            <h1
              className={cn(
                "font-calistoga text-[15px] truncate transition-opacity",
                animDuration,
                "text-elite-burgundy",
                transparent && !isScrolled ? "opacity-85" : "opacity-100",
              )}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right Side - Menu Button or Spacer - Same width as left for symmetry */}
        <div className="flex items-center justify-end w-[52px] flex-shrink-0">
          {showMenu ? (
            <button
              onClick={onMenuClick}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                "bg-elite-burgundy/8 active:bg-elite-burgundy/20",
                "active:scale-95 touch-manipulation",
                "transition-all",
                animDuration,
              )}
              aria-label="Open menu"
            >
              <Menu
                className="w-[18px] h-[18px] text-elite-burgundy"
                strokeWidth={2.5}
              />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
