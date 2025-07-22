'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function FindAndGet() {
  const classicDrinksRef = useRef(null);
  const specialDrinksRef = useRef(null);
  const kidsCornerRef = useRef(null);

  useEffect(() => {
    // Set initial state - scale down to 0
    gsap.set([classicDrinksRef.current, specialDrinksRef.current, kidsCornerRef.current], {
      scale: 0,
      opacity: 0
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: classicDrinksRef.current,
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none"
      }
    });

    // Animate circles in sequence with zoom effect
    tl.to(classicDrinksRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    })
    .to(specialDrinksRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.6") // Start 0.6 seconds before previous animation ends
    .to(kidsCornerRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.6"); // Start 0.6 seconds before previous animation ends
  }, []);

  return (
    <section className="bg-elite-cream py-20 xl:py-36 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-5xl md:text-6xl lg:text-7xl mb-16">
          Find and Get<br />What You Love
        </h2>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Classic Drinks Category */}
          <Link href="/menu/classic-drinks" className="flex flex-col items-center group cursor-pointer">
            <div ref={classicDrinksRef} className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg">
              <img
                src="https://ext.same-assets.com/1022434225/2187497136.avif"
                alt="Classic Drinks"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
              Classic Drinks
            </h3>
          </Link>

          {/* Special Drinks Category */}
          <Link href="/menu/special-drinks" className="flex flex-col items-center group cursor-pointer">
            <div ref={specialDrinksRef} className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg">
              <img
                src="https://ext.same-assets.com/1022434225/3438940369.avif"
                alt="Special Drinks"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
              Special Drinks
            </h3>
          </Link>

          {/* Kids' Corner Category */}
          <Link href="/menu/kids-corner" className="flex flex-col items-center group cursor-pointer">
            <div ref={kidsCornerRef} className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <span className="text-6xl">🎈</span>
              </div>
            </div>
            <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
              Kids' Corner
            </h3>
          </Link>
        </div>
      </div>
    </section>
  );
}
