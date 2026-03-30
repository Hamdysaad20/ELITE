"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import Image from "next/image";

export default function Hero() {
  const leftCupRef = useRef(null);
  const centerCupRef = useRef(null);
  const rightCupRef = useRef(null);
  const t = useTranslations("hero");

  // Handle location navigation
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const locationElement = document.getElementById("location");
    if (locationElement) {
      locationElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    // Set initial state
    gsap.set([leftCupRef.current, centerCupRef.current, rightCupRef.current], {
      opacity: 0,
      y: 100,
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline();

    // Animate cups in order: center, left, right
    tl.to(centerCupRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    })
      .to(
        leftCupRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6",
      ) // Start 0.6 seconds before previous animation ends
      .to(
        rightCupRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6",
      ); // Start 0.6 seconds before previous animation ends
  }, []);

  return (
    <section
      className="bg-elite-burgundy flex flex-col min-h-[85vh] md:max-h-[90vh] relative overflow-hidden"
      aria-label="Homepage hero"
    >
      {/* Background decorative elements - subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-elite-cream/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-elite-cream/5 rounded-full blur-[80px]" />
      </div>

      {/* Main content area - Optimized for mobile */}
      <div className="relative flex flex-col items-center justify-center text-center px-5 pt-16 md:pt-20 flex-1 z-20">
        {/* Title with refined typography */}
        <h1 className="font-calistoga text-elite-white text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.04] tracking-[-0.02em] max-w-4xl mb-4 md:mb-6">
          {t("titleLine1")}
          <br />
          <span className="text-elite-cream/90">{t("titleLine2")}</span>
        </h1>

        {/* Subtitle - Compact on mobile */}
        <p className="text-elite-white/85 font-cabin text-[15px] sm:text-lg md:text-xl mb-8 md:mb-10 max-w-sm sm:max-w-md md:max-w-2xl leading-[1.7] font-medium">
          {t("subtitle")}
        </p>

        {/* CTA Buttons - Full width on mobile, side by side on larger */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto px-2 sm:px-0 relative z-30">
          <LocalizedLink
            href="/menu"
            className="w-full sm:w-auto bg-elite-cream text-elite-burgundy px-8 py-3.5 sm:py-3 rounded-full font-cabin text-sm sm:text-base font-bold tracking-wide shadow-lg shadow-black/10 active:scale-95 hover:bg-elite-white hover:shadow-xl transition-all duration-200 touch-manipulation inline-flex items-center justify-center relative z-30"
          >
            {t("ctaExplore")}
          </LocalizedLink>
          <button
            onClick={handleLocationClick}
            className="w-full sm:w-auto border-2 border-elite-cream/80 text-elite-cream px-8 py-3.5 sm:py-3 rounded-full font-cabin text-sm sm:text-base font-semibold tracking-wide active:scale-95 hover:bg-elite-cream hover:text-elite-burgundy transition-all duration-200 touch-manipulation relative z-30"
          >
            {t("ctaLocation")}
          </button>
        </div>

        <div className="mt-4 sm:mt-5 w-full max-w-3xl px-2">
          <p className="text-elite-cream/80 text-[11px] sm:text-xs font-cabin font-semibold tracking-[0.14em] uppercase mb-2 text-center">
            Elite vibes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <LocalizedLink
              href="/menu/classic-drinks/milk-classics/matcha-latte"
              className="rounded-full bg-elite-cream/15 border border-elite-cream/20 px-3 py-1.5 text-elite-cream text-xs sm:text-sm font-cabin hover:bg-elite-cream/25 transition-colors"
            >
              Matcha
            </LocalizedLink>
            <LocalizedLink
              href="/menu"
              className="rounded-full bg-elite-cream/15 border border-elite-cream/20 px-3 py-1.5 text-elite-cream text-xs sm:text-sm font-cabin hover:bg-elite-cream/25 transition-colors"
            >
              Boba Chocolate
            </LocalizedLink>
            <LocalizedLink
              href="/menu"
              className="rounded-full bg-elite-cream/15 border border-elite-cream/20 px-3 py-1.5 text-elite-cream text-xs sm:text-sm font-cabin hover:bg-elite-cream/25 transition-colors"
            >
              Oreo Milkshake
            </LocalizedLink>
            <LocalizedLink
              href="/menu"
              className="rounded-full bg-elite-cream/15 border border-elite-cream/20 px-3 py-1.5 text-elite-cream text-xs sm:text-sm font-cabin hover:bg-elite-cream/25 transition-colors"
            >
              Kinder Milkshake
            </LocalizedLink>
          </div>
        </div>
      </div>

      {/* Coffee Cups Section - Refined for mobile */}
      <div className="relative h-44 sm:h-56 md:h-72 lg:h-80 bg-elite-burgundy flex-shrink-0 mt-auto pointer-events-none">
        <div className="mx-auto h-full max-w-5xl px-4">
          <div className="flex items-end justify-center h-full">
            {/* Left Cup - Hidden on mobile */}
            <div
              ref={leftCupRef}
              className="hidden sm:flex items-end justify-center -rotate-12 -mr-8 md:-mr-12 pointer-events-none"
            >
              <div className="w-36 md:w-48 lg:w-56 aspect-[4/5] pointer-events-none relative">
                <Image
                  src="/Old Items/Kinder Milkshake-1.png"
                  alt="Kinder Milkshake"
                  fill
                  sizes="(max-width: 768px) 144px, 224px"
                  className="object-contain drop-shadow-2xl translate-y-4 pointer-events-none"
                />
              </div>
            </div>

            {/* Center Cup - Prominent on mobile */}
            <div
              ref={centerCupRef}
              className="flex items-end justify-center z-10 pointer-events-none"
            >
              <div className="w-52 sm:w-56 md:w-64 lg:w-72 aspect-[4/5] pointer-events-none relative">
                <Image
                  src="/Old Items/Boba Chocolate-1.png"
                  alt="Boba Chocolate"
                  fill
                  sizes="(max-width: 640px) 208px, (max-width: 768px) 224px, 288px"
                  className="object-contain drop-shadow-2xl translate-y-6 sm:translate-y-4 pointer-events-none"
                  priority
                />
              </div>
            </div>

            {/* Right Cup - Hidden on mobile */}
            <div
              ref={rightCupRef}
              className="hidden sm:flex items-end justify-center rotate-12 -ml-8 md:-ml-12 pointer-events-none"
            >
              <div className="w-36 md:w-48 lg:w-56 aspect-[4/5] pointer-events-none relative">
                <Image
                  src="/Old Items/Oreo Milkshake-1.png"
                  alt="Oreo Milkshake"
                  fill
                  sizes="(max-width: 768px) 144px, 224px"
                  className="object-contain drop-shadow-2xl translate-y-4 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee Section - Compact on mobile */}
      <div className="bg-elite-cream py-4 md:py-6 overflow-hidden w-full flex-shrink-0 relative z-10">
        <div className="marquee-container w-full">
          <div className="marquee-content text-sm md:text-base">
            {[
              { icon: "🌎", text: t("marquee.globalFlavor") },
              { icon: "☕", text: t("marquee.friendlyBaristas") },
              { icon: "⭐", text: t("marquee.greatCoffee") },
              { icon: "⚡", text: t("marquee.fastService") },
              { icon: "🏠", text: t("marquee.cozySpace") },
              { icon: "📸", text: t("marquee.handcraftedDrinks") },
              { icon: "🏆", text: t("marquee.localRoasts") },
            ]
              .flatMap((item) => [item, item, item])
              .map((item, index) => (
                <div className="marquee-item" key={`${item.text}-${index}`}>
                  <span className="flex items-center space-x-2">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
