"use client";

import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface CategoryCardProps {
  href: string;
  refProp: React.RefObject<HTMLDivElement>;
  imageSrc?: string;
  altText: string;
  title: string;
  emoji?: string;
}

const CategoryCard = ({
  href,
  refProp,
  imageSrc,
  altText,
  title,
  emoji,
}: CategoryCardProps) => (
  <Link href={href} className="flex flex-col items-center group cursor-pointer">
    <div
      ref={refProp}
      className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={altText}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
          <span className="text-6xl">{emoji}</span>
        </div>
      )}
    </div>
    <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
      {title}
    </h3>
  </Link>
);

export default function FindAndGet() {
  const classicDrinksRef = useRef<HTMLDivElement>(null);
  const specialDrinksRef = useRef<HTMLDivElement>(null);
  const kidsCornerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs = [classicDrinksRef, specialDrinksRef, kidsCornerRef];

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
        trigger: classicDrinksRef.current,
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
        <h2 className="font-calistoga text-elite-black text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-8 sm:mb-12 lg:mb-16">
          Find and Get
          <br />
          What You Love
        </h2>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
          {/* Classic Drinks Category */}
          <CategoryCard
            href="/menu/classic-drinks"
            refProp={classicDrinksRef}
            imageSrc="https://ext.same-assets.com/1022434225/2187497136.avif"
            altText="Classic Drinks"
            title="Classic Drinks"
          />

          {/* Special Drinks Category */}
          <CategoryCard
            href="/menu/special-drinks"
            refProp={specialDrinksRef}
            imageSrc="https://ext.same-assets.com/1022434225/3438940369.avif"
            altText="Special Drinks"
            title="Special Drinks"
          />

          {/* Kids' Corner Category */}
          <CategoryCard
            href="/menu/kids-corner"
            refProp={kidsCornerRef}
            altText="Kids' Corner"
            title="Kids' Corner"
            emoji="🎈"
          />
        </div>
      </div>
    </section>
  );
}
