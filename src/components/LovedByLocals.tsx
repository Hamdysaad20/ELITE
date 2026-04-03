"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTranslations } from "next-intl";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import { AlertCircle } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLandingReveal } from "@/hooks/useLandingReveal";

export default function LovedByLocals() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("lovedByLocals");
  const { products, loading, error, isPersonalized } = useRecommendedProducts();

  const hasReadyProducts = !loading && products.length > 0;

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: hasReadyProducts ? [headingRef, ctaRef] : [],
    staggerTargets: hasReadyProducts ? [productRefs.current] : [],
    start: "top 88%",
  });

  useEffect(() => {
    const cards = productRefs.current.filter(Boolean);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!hasReadyProducts || prefersReducedMotion) {
      return;
    }

    if (!window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    const cleanups = cards.map((card) => {
      if (!card) {
        return () => undefined;
      }

      const handleMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        gsap.to(card, {
          x: x * 8,
          y: y * 8,
          rotateY: x * 5,
          rotateX: -y * 5,
          duration: 0.3,
          ease: "power2.out",
        });
      };

      const handleLeave = () => {
        gsap.to(card, {
          x: 0,
          y: 0,
          rotateY: 0,
          rotateX: 0,
          duration: 0.45,
          ease: "power2.out",
        });
      };

      card.addEventListener("mousemove", handleMove);
      card.addEventListener("mouseleave", handleLeave);

      return () => {
        card.removeEventListener("mousemove", handleMove);
        card.removeEventListener("mouseleave", handleLeave);
        gsap.to(card, {
          x: 0,
          y: 0,
          rotateY: 0,
          rotateX: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [hasReadyProducts]);

  return (
    <section
      ref={sectionRef}
      className="bg-elite-cream py-12 sm:py-16 md:py-24 px-3 sm:px-6 relative will-change-transform"
    >
      {/* Subtle decorative bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[5%] w-40 h-40 bg-elite-burgundy/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[8%] w-32 h-32 bg-elite-burgundy/[0.02] rounded-full blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Section Heading */}
        <div ref={headingRef}>
          <h2 className="font-calistoga text-elite-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] mb-2 sm:mb-3">
            {t("title")}
          </h2>
          <p className="text-elite-black/60 font-cabin text-sm sm:text-base md:text-lg mb-8 sm:mb-10 md:mb-14 max-w-lg mx-auto leading-relaxed">
            {t("subtitle")}
            {isPersonalized && (
              <span className="block text-sm text-elite-burgundy/70 mt-2 font-medium">
                ✨ Personalized for you
              </span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mb-16 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-elite-burgundy/10 rounded-2xl mb-4 w-full aspect-square" />
                <div className="h-4 bg-elite-burgundy/8 rounded-full w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-16 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex items-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-cabin text-sm">{error}</span>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="mb-10 sm:mb-14">
            {/* Mobile: Horizontal Scroll */}
            <div className="sm:hidden overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4 snap-x snap-mandatory">
                {products.map((product, index) => (
                  <LocalizedLink
                    key={product.id}
                    href={`/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`}
                    className="min-w-[160px] max-w-[180px] flex-shrink-0 snap-start"
                  >
                    <div
                      ref={(el) => {
                        productRefs.current[index] = el;
                      }}
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      <div className="bg-elite-burgundy rounded-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl mb-3 relative overflow-hidden w-full aspect-square shadow-md group-hover:shadow-elite-burgundy/20">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-center w-full">
                        <h3 className="font-calistoga text-elite-black text-sm sm:text-base leading-snug">
                          {product.name}
                        </h3>
                        {product.reason && (
                          <p className="text-xs text-elite-burgundy/50 mt-1">
                            {product.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </LocalizedLink>
                ))}
              </div>
            </div>

            {/* Tablet: 2 Columns */}
            <div
              className="hidden sm:grid md:hidden grid-cols-2 gap-6 px-2"
              style={{ perspective: "800px" }}
            >
              {products.map((product, index) => (
                <LocalizedLink
                  key={product.id}
                  href={`/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`}
                  className="block"
                >
                  <div
                    ref={(el) => {
                      productRefs.current[index] = el;
                    }}
                    className="group cursor-pointer flex flex-col items-center"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="bg-elite-burgundy rounded-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-elite-burgundy/15 mb-4 relative overflow-hidden w-full max-w-sm aspect-square shadow-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center w-full">
                      <h3 className="font-calistoga text-elite-black text-xl leading-snug group-hover:text-elite-burgundy transition-colors">
                        {product.name}
                      </h3>
                      {product.reason && (
                        <p className="text-sm text-elite-burgundy/50 mt-1">
                          {product.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </LocalizedLink>
              ))}
            </div>

            {/* Desktop: 4 Columns */}
            <div
              className="hidden md:grid grid-cols-4 gap-6"
              style={{ perspective: "800px" }}
            >
              {products.map((product, index) => (
                <LocalizedLink
                  key={product.id}
                  href={`/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`}
                  className="block"
                >
                  <div
                    ref={(el) => {
                      productRefs.current[index] = el;
                    }}
                    className="group cursor-pointer flex flex-col items-center"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="bg-elite-burgundy rounded-2xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-elite-burgundy/15 mb-4 relative overflow-hidden w-full aspect-square shadow-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center w-full">
                      <h3 className="font-calistoga text-elite-black text-lg lg:text-xl leading-snug group-hover:text-elite-burgundy transition-colors duration-200">
                        {product.name}
                      </h3>
                      {product.reason && (
                        <p className="text-xs lg:text-sm text-elite-burgundy/50 mt-1">
                          {product.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          </div>
        )}

        {/* Explore Menu Button */}
        <div ref={ctaRef}>
          <LocalizedLink
            href="/menu"
            className="btn-shimmer inline-flex items-center justify-center bg-elite-burgundy text-elite-cream px-9 py-3.5 rounded-full font-cabin text-sm sm:text-base font-bold tracking-wide shadow-md shadow-elite-burgundy/15 hover:shadow-lg hover:shadow-elite-burgundy/25 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {t("cta")}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
