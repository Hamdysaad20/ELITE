"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname } from "@/i18n/routing";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import { Coffee, AlertCircle } from "lucide-react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function LovedByLocals() {
  const productRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const locale = useLocale();
  const t = useTranslations("lovedByLocals");
  const { products, loading, error, isPersonalized } = useRecommendedProducts();

  useEffect(() => {
    // Set initial state - scale down to 0
    gsap.set([...productRefs.current, buttonRef.current], {
      scale: 0,
      opacity: 0,
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: productRefs.current[0],
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none",
      },
    });

    // Animate products in sequence
    tl.to(productRefs.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)",
      stagger: 0.2,
    })
      // Animate button last
      .to(
        buttonRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.4",
      );
  }, []);

  return (
    <section className="bg-elite-cream py-12 sm:py-16 md:py-24 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 md:mb-6">
          {t("title")}
        </h2>

        {/* Subtext */}
        <p className="text-elite-black font-cabin text-base sm:text-lg md:text-xl mb-12 md:mb-16 max-w-2xl mx-auto leading-relaxed">
          {t("subtitle")}
          {isPersonalized && (
            <span className="block text-sm text-elite-burgundy/70 mt-2">
              ✨ Personalized for you
            </span>
          )}
        </p>

        {/* Loading State */}
        {loading && (
          <div className="mb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-elite-burgundy/20 rounded-2xl mb-4 w-full aspect-square" />
                <div className="h-4 bg-elite-burgundy/10 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-16 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Grid - Mobile: Horizontal Scroll, Desktop: Grid */}
        {!loading && products.length > 0 && (
          <div className="mb-16">
            {/* Mobile: Horizontal Scroll */}
            <div className="sm:hidden overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4 snap-x snap-mandatory">
                {products.map((product, index) => (
                  <a
                    key={product.id}
                    href={addLocaleToPathname(
                      `/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`,
                      locale,
                    )}
                    className="group cursor-pointer flex flex-col items-center min-w-[160px] max-w-[180px] flex-shrink-0 snap-start"
                    ref={(el) => {
                      productRefs.current[index] = el;
                    }}
                  >
                    <div className="bg-elite-burgundy rounded-2xl transition-transform group-hover:scale-110 mb-3 relative overflow-hidden w-full aspect-square shadow-md">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center w-full">
                      <h3 className="font-calistoga text-elite-black text-sm sm:text-base leading-tight">
                        {product.name}
                      </h3>
                      {product.reason && (
                        <p className="text-xs text-elite-burgundy/60 mt-1">
                          {product.reason}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Tablet: 2 Columns */}
            <div className="hidden sm:grid md:hidden grid-cols-2 gap-6 px-2">
              {products.map((product, index) => (
                <a
                  key={product.id}
                  href={addLocaleToPathname(
                    `/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`,
                    locale,
                  )}
                  className="group cursor-pointer flex flex-col items-center"
                  ref={(el) => {
                    productRefs.current[index] = el;
                  }}
                >
                  <div className="bg-elite-burgundy rounded-2xl transition-transform group-hover:scale-110 mb-4 relative overflow-hidden w-full max-w-sm aspect-square shadow-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center w-full">
                    <h3 className="font-calistoga text-elite-black text-xl">
                      {product.name}
                    </h3>
                    {product.reason && (
                      <p className="text-sm text-elite-burgundy/60 mt-1">
                        {product.reason}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>

            {/* Desktop: 4 Columns */}
            <div className="hidden md:grid grid-cols-4 gap-6">
              {products.map((product, index) => (
                <a
                  key={product.id}
                  href={addLocaleToPathname(
                    `/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`,
                    locale,
                  )}
                  className="group cursor-pointer flex flex-col items-center"
                  ref={(el) => {
                    productRefs.current[index] = el;
                  }}
                >
                  <div className="bg-elite-burgundy rounded-2xl transition-transform group-hover:scale-110 mb-4 relative overflow-hidden w-full aspect-square shadow-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center w-full">
                    <h3 className="font-calistoga text-elite-black text-lg lg:text-xl">
                      {product.name}
                    </h3>
                    {product.reason && (
                      <p className="text-xs lg:text-sm text-elite-burgundy/60 mt-1">
                        {product.reason}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Explore Menu Button */}
        <button
          ref={buttonRef}
          className="bg-elite-burgundy text-elite-white px-8 py-3 rounded-full font-cabin text-base font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
        >
          {t("cta")}
        </button>
      </div>
    </section>
  );
}
