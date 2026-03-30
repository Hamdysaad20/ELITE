"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import { AlertCircle } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";

const SUGGESTED_CATEGORIES = ["Iced", "Boba", "Smoothies", "Milkshakes"];
const HIGHLIGHTED_ITEMS = [
  {
    name: "Kinder Milkshake",
    productName: "Kinder Milkshake",
    imageSrc: "/Old Items/Kinder Milkshake-1.png",
  },
  {
    name: "Oreo Milkshake",
    productName: "Oreo Milkshake",
    imageSrc: "/Old Items/Oreo Milkshake-1.png",
  },
  {
    name: "Boba Chococate",
    productName: "Boba Chocolate",
    imageSrc: "/Old Items/Boba Chocolate-1.png",
  },
  {
    name: "Taro Matcha",
    productName: "Taro Matcha",
    imageSrc: "/Old Items/Matcha Latte-1.png",
  },
];

function isHighlightedProduct(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    normalized === "kinder milkshake" ||
    normalized === "oreo milkshake" ||
    normalized === "boba chocolate" ||
    normalized === "boba chococate" ||
    normalized.includes("matcha")
  );
}

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function LovedByLocals() {
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);
  const t = useTranslations("lovedByLocals");
  const { products, loading, error, isPersonalized } = useRecommendedProducts();

  useEffect(() => {
    // Set initial state - scale down to 0
    gsap.set(productRefs.current, {
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
    });
  }, []);

  return (
    <section className="bg-elite-cream py-12 sm:py-16 md:py-24 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.08] tracking-[-0.02em] mb-3 sm:mb-4 md:mb-6">
          {t("title")}
        </h2>

        {/* Subtext */}
        <p className="text-elite-black font-cabin text-[15px] sm:text-lg md:text-xl mb-12 md:mb-16 max-w-2xl mx-auto leading-[1.7] font-medium">
          {t("subtitle")}
          {isPersonalized && (
            <span className="block text-sm text-elite-burgundy/70 mt-2">
              ✨ Personalized for you
            </span>
          )}
        </p>

        <div className="mb-8 space-y-3 rounded-2xl border border-elite-burgundy/20 bg-elite-burgundy/[0.06] p-4 sm:p-5">
          <p className="text-elite-burgundy font-cabin text-xs sm:text-sm font-bold tracking-[0.14em] uppercase">
            Elite vibes
          </p>
          <p className="text-elite-black/90 font-cabin text-sm sm:text-base leading-relaxed">
            {SUGGESTED_CATEGORIES.join(" • ")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {HIGHLIGHTED_ITEMS.map((item) => (
              <LocalizedLink
                key={item.name}
                href={`/menu?product=${encodeURIComponent(item.productName)}`}
                className="inline-flex items-center gap-2 rounded-full bg-elite-burgundy text-elite-cream pr-3 pl-1 py-1 shadow-md shadow-elite-burgundy/20 transition-transform hover:scale-[1.03] hover:opacity-95"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-elite-burgundy/10 relative">
                  <Image
                    src={item.imageSrc}
                    alt={item.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-elite-cream">
                  {item.name}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-elite-cream/85">
                  Order now
                </span>
              </LocalizedLink>
            ))}
          </div>
        </div>

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
                  <LocalizedLink
                    key={product.id}
                    href={`/menu/${product.category?.toLowerCase().replace(/\s+/g, "-") || ""}`}
                    className="min-w-[160px] max-w-[180px] flex-shrink-0 snap-start"
                  >
                    <div
                      ref={(el) => {
                        productRefs.current[index] = el;
                      }}
                      className={`group cursor-pointer flex flex-col items-center ${
                        isHighlightedProduct(product.name)
                          ? "rounded-2xl ring-2 ring-elite-burgundy/50 p-2"
                          : ""
                      }`}
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
                        <h3 className="font-calistoga text-elite-black text-sm sm:text-base leading-[1.25] tracking-[-0.01em]">
                          {product.name}
                        </h3>
                        {isHighlightedProduct(product.name) && (
                          <p className="text-[10px] sm:text-xs text-elite-burgundy font-semibold mt-1">
                            Highlighted
                          </p>
                        )}
                        {product.reason && (
                          <p className="text-xs text-elite-burgundy/60 mt-1">
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
            <div className="hidden sm:grid md:hidden grid-cols-2 gap-6 px-2">
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
                    className={`group cursor-pointer flex flex-col items-center ${
                      isHighlightedProduct(product.name)
                        ? "rounded-2xl ring-2 ring-elite-burgundy/50 p-2"
                        : ""
                    }`}
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
                      <h3 className="font-calistoga text-elite-black text-xl leading-[1.2] tracking-[-0.01em]">
                        {product.name}
                      </h3>
                      {isHighlightedProduct(product.name) && (
                        <p className="text-xs text-elite-burgundy font-semibold mt-1">
                          Highlighted
                        </p>
                      )}
                      {product.reason && (
                        <p className="text-sm text-elite-burgundy/60 mt-1">
                          {product.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </LocalizedLink>
              ))}
            </div>

            {/* Desktop: 4 Columns */}
            <div className="hidden md:grid grid-cols-4 gap-6">
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
                    className={`group cursor-pointer flex flex-col items-center ${
                      isHighlightedProduct(product.name)
                        ? "rounded-2xl ring-2 ring-elite-burgundy/50 p-2"
                        : ""
                    }`}
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
                      <h3 className="font-calistoga text-elite-black text-lg lg:text-xl leading-[1.2] tracking-[-0.01em]">
                        {product.name}
                      </h3>
                      {isHighlightedProduct(product.name) && (
                        <p className="text-xs text-elite-burgundy font-semibold mt-1">
                          Highlighted
                        </p>
                      )}
                      {product.reason && (
                        <p className="text-xs lg:text-sm text-elite-burgundy/60 mt-1">
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
        <LocalizedLink
          href="/menu"
          className="inline-flex items-center justify-center bg-elite-burgundy text-elite-white px-8 py-3 rounded-full font-cabin text-sm sm:text-base font-semibold tracking-wide hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
        >
          {t("cta")}
        </LocalizedLink>
      </div>
    </section>
  );
}
