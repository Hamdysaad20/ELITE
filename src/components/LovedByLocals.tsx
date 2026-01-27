"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale, useTranslations } from "next-intl";
import { addLocaleToPathname } from "@/i18n/routing";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function LovedByLocals() {
  const productRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const locale = useLocale();
  const t = useTranslations("lovedByLocals");

  const products = [
    {
      name: t("products.cappuccino"),
      image: "https://ext.same-assets.com/1022434225/2347648118.avif",
      link: "/menu/classic-drinks",
    },
    {
      name: t("products.bubbleTea"),
      image: "https://ext.same-assets.com/1022434225/4278114908.avif",
      link: "/menu/special-drinks",
    },
    {
      name: t("products.icedTea"),
      image: "https://ext.same-assets.com/1022434225/703059297.avif",
      link: "/menu/special-drinks",
    },
    {
      name: t("products.icedLatte"),
      image: "https://ext.same-assets.com/1022434225/1157300862.avif",
      link: "/menu/special-drinks",
    },
  ];

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
    <section className="bg-elite-cream py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-4 sm:mb-6">
          {t("title")}
        </h2>

        {/* Subtext */}
        <p className="text-elite-black font-cabin text-xl md:text-2xl mb-16 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>

        {/* Product Grid - Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="mb-16">
          {/* Mobile: Horizontal Scroll */}
          <div className="sm:hidden overflow-x-auto -mx-6 px-6 pb-4 scrollbar-hide">
            <div className="flex gap-6 snap-x snap-mandatory">
              {products.map((product, index) => (
                <a
                  key={index}
                  href={addLocaleToPathname(product.link, locale)}
                  className="group cursor-pointer flex flex-col items-center w-[240px] flex-shrink-0 snap-start"
                  ref={(el) => {
                    productRefs.current[index] = el;
                  }}
                >
                  <div className="bg-elite-burgundy rounded-3xl transition-transform group-hover:scale-105 mb-4 relative overflow-hidden w-full">
                    <div className="aspect-square overflow-hidden rounded-2xl flex items-end">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-bottom"
                      />
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <h3 className="font-calistoga text-elite-black text-xl">
                      {product.name}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <a
                key={index}
                href={addLocaleToPathname(product.link, locale)}
                className="group cursor-pointer flex flex-col items-center"
                ref={(el) => {
                  productRefs.current[index] = el;
                }}
              >
                <div className="bg-elite-burgundy rounded-3xl transition-transform group-hover:scale-105 mb-4 relative overflow-hidden">
                  <div className="aspect-square overflow-hidden rounded-2xl flex items-end">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-bottom"
                    />
                  </div>
                </div>
                <div className="text-center w-full">
                  <h3 className="font-calistoga text-elite-black text-2xl">
                    {product.name}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Explore Menu Button */}
        <button
          ref={buttonRef}
          className="bg-elite-burgundy text-elite-white px-6 py-3 rounded-full font-cabin text-base font-semibold hover:opacity-90 transition-opacity"
        >
          {t("cta")}
        </button>
      </div>
    </section>
  );
}
