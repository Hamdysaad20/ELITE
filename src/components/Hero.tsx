"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Hero() {
  const leftCupRef = useRef(null);
  const centerCupRef = useRef(null);
  const rightCupRef = useRef(null);
  const router = useRouter();

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
    <section className="bg-elite-burgundy flex flex-col min-h-[85vh] md:max-h-[90vh] relative overflow-hidden">
      {/* Background decorative elements - subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-elite-cream/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-elite-cream/5 rounded-full blur-[80px]" />
      </div>

      {/* Main content area - Optimized for mobile */}
      <div className="relative flex flex-col items-center justify-center text-center px-5 pt-16 md:pt-20 flex-1 z-20">
        {/* Title with refined typography */}
        <h1 className="font-calistoga text-elite-white text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] max-w-4xl mb-4 md:mb-6">
          Life Begins
          <br />
          <span className="text-elite-cream/90">After Coffee</span>
        </h1>

        {/* Subtitle - Compact on mobile */}
        <p className="text-elite-white/80 font-cabin text-base sm:text-lg md:text-xl mb-8 md:mb-10 max-w-sm sm:max-w-md md:max-w-2xl leading-relaxed">
          Because great coffee is the start of something even greater.
        </p>

        {/* CTA Buttons - Full width on mobile, side by side on larger */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto px-2 sm:px-0 relative z-30">
          <Link
            href="/menu"
            className="w-full sm:w-auto bg-elite-cream text-elite-burgundy px-8 py-3.5 sm:py-3 rounded-full font-cabin text-base font-bold shadow-lg shadow-black/10 active:scale-95 hover:bg-elite-white hover:shadow-xl transition-all duration-200 touch-manipulation inline-flex items-center justify-center relative z-30"
          >
            Explore Menu
          </Link>
          <button
            onClick={handleLocationClick}
            className="w-full sm:w-auto border-2 border-elite-cream/80 text-elite-cream px-8 py-3.5 sm:py-3 rounded-full font-cabin text-base font-semibold active:scale-95 hover:bg-elite-cream hover:text-elite-burgundy transition-all duration-200 touch-manipulation relative z-30"
          >
            Our Locations
          </button>
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
              <div className="w-36 md:w-48 lg:w-56 aspect-[4/5] pointer-events-none">
                <img
                  src="https://ext.same-assets.com/1022434225/3040081048.avif"
                  alt="Just Coffee Cup"
                  className="w-full h-full object-contain drop-shadow-2xl translate-y-4 pointer-events-none"
                  loading="eager"
                />
              </div>
            </div>

            {/* Center Cup - Prominent on mobile */}
            <div
              ref={centerCupRef}
              className="flex items-end justify-center z-10 pointer-events-none"
            >
              <div className="w-52 sm:w-56 md:w-64 lg:w-72 aspect-[4/5] pointer-events-none">
                <img
                  src="https://ext.same-assets.com/1022434225/3705697434.avif"
                  alt="Espresso Cup"
                  className="w-full h-full object-contain drop-shadow-2xl translate-y-6 sm:translate-y-4 pointer-events-none"
                  loading="eager"
                />
              </div>
            </div>

            {/* Right Cup - Hidden on mobile */}
            <div
              ref={rightCupRef}
              className="hidden sm:flex items-end justify-center rotate-12 -ml-8 md:-ml-12 pointer-events-none"
            >
              <div className="w-36 md:w-48 lg:w-56 aspect-[4/5] pointer-events-none">
                <img
                  src="https://ext.same-assets.com/1022434225/515548484.avif"
                  alt="Cold Brew Cup"
                  className="w-full h-full object-contain drop-shadow-2xl translate-y-4 pointer-events-none"
                  loading="eager"
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
            {/* Original Content */}
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🌎</span>
                <span>Global Flavor</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>☕</span>
                <span>Friendly Baristas</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>⭐</span>
                <span>Great Coffee</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Fast Service</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🏠</span>
                <span>Cozy Space</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>📸</span>
                <span>Handcrafted Drinks</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Local Roasts</span>
              </span>
            </div>

            {/* First Duplicate */}
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🌎</span>
                <span>Global Flavor</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>☕</span>
                <span>Friendly Baristas</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>⭐</span>
                <span>Great Coffee</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Fast Service</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🏠</span>
                <span>Cozy Space</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>📸</span>
                <span>Handcrafted Drinks</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Local Roasts</span>
              </span>
            </div>

            {/* Second Duplicate */}
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🌎</span>
                <span>Global Flavor</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>☕</span>
                <span>Friendly Baristas</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>⭐</span>
                <span>Great Coffee</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Fast Service</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🏠</span>
                <span>Cozy Space</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>📸</span>
                <span>Handcrafted Drinks</span>
              </span>
            </div>
            <div className="marquee-item">
              <span className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Local Roasts</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
