"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import Image from "next/image";
import { MENU_ENDPOINTS } from "@/lib/constants";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface CategoryCardProps {
  href: string;
  refProp: React.RefObject<HTMLDivElement>;
  imageSrc?: string;
  altText: string;
  title: string;
  description: string;
  emoji?: string;
}

const CategoryCard = ({
  href,
  refProp,
  imageSrc,
  altText,
  title,
  description,
  emoji,
}: CategoryCardProps) => (
  <LocalizedLink
    href={href}
    className="flex flex-col items-center group cursor-pointer rounded-3xl p-3 sm:p-4 transition-colors hover:bg-elite-burgundy/[0.04]"
  >
    <div
      ref={refProp}
      className="w-56 h-56 lg:w-80 lg:h-80 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg relative"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={altText}
          fill
          sizes="(max-width: 1024px) 224px, 320px"
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
          <span className="text-6xl">{emoji}</span>
        </div>
      )}
    </div>
    <h3 className="font-calistoga text-elite-black text-2xl sm:text-3xl lg:text-4xl leading-[1.15] tracking-[-0.01em]">
      {title}
    </h3>
    <p className="mt-2 text-sm sm:text-base font-cabin text-elite-black/75 text-center max-w-[16rem] leading-relaxed">
      {description}
    </p>
    <span className="mt-3 inline-flex items-center rounded-full bg-elite-burgundy text-elite-white px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide uppercase">
      Browse
    </span>
  </LocalizedLink>
);

export default function FindAndGet() {
  const specialDrinksRef = useRef<HTMLDivElement>(null);
  const kidsCornerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("findAndGet");

  useEffect(() => {
    const refs = [specialDrinksRef, kidsCornerRef];

    // Set initial state - scale down to 0
    gsap.set(
      refs.map((ref) => ref.current),
      {
        scale: 0,
        opacity: 0,
      },
    );

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: specialDrinksRef.current,
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none",
      },
    });

    // Animate circles in sequence with zoom effect
    refs.forEach((ref, index) => {
      tl.to(
        ref.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        index === 0 ? 0 : "-=0.6",
      );
    });

    // Cleanup function
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="bg-elite-cream py-12 sm:py-16 md:py-20 xl:py-36 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-[1.08] tracking-[-0.02em] mb-8 sm:mb-12 lg:mb-16">
          {t("titleLine1")}
          <br />
          {t("titleLine2")}
        </h2>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
          {/* Special Drinks Category */}
          <CategoryCard
            href={MENU_ENDPOINTS.SPECIAL}
            refProp={specialDrinksRef}
            imageSrc="/Old Items/Mix Choco Mango Shake-1.png"
            altText={t("categories.special")}
            title={t("categories.special")}
            description="Creative blends for bold flavor cravings."
          />

          {/* Kids' Corner Category */}
          <CategoryCard
            href={MENU_ENDPOINTS.KIDS}
            refProp={kidsCornerRef}
            imageSrc="/kids corner/kids_corner_draft2.3.png"
            altText={t("categories.kids")}
            title={t("categories.kids")}
            description="Fun, sweet picks for little coffee lovers."
          />
        </div>
      </div>
    </section>
  );
}
