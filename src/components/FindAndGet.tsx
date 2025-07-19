'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function FindAndGet() {
  const coffeeRef = useRef(null);
  const coldDrinksRef = useRef(null);
  const bakeryRef = useRef(null);

  useEffect(() => {
    // Set initial state - scale down to 0
    gsap.set([coffeeRef.current, coldDrinksRef.current, bakeryRef.current], {
      scale: 0,
      opacity: 0
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: coffeeRef.current,
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none"
      }
    });

    // Animate circles in sequence with zoom effect
    tl.to(coffeeRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    })
    .to(coldDrinksRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.6") // Start 0.6 seconds before previous animation ends
    .to(bakeryRef.current, {
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
          {/* Coffee Category */}
          <div ref={coffeeRef} className="flex flex-col items-center group cursor-pointer">
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg">
              <img
                src="https://ext.same-assets.com/1022434225/2187497136.avif"
                alt="Coffee"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
              Coffee
            </h3>
          </div>

          {/* Cold Drinks Category */}
          <div ref={coldDrinksRef} className="flex flex-col items-center group cursor-pointer">
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg">
              <img
                src="https://ext.same-assets.com/1022434225/3438940369.avif"
                alt="Cold Drinks"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
              Cold Drinks
            </h3>
          </div>

          {/* Bakery Category */}
          <div ref={bakeryRef} className="flex flex-col items-center group cursor-pointer">
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-elite-burgundy overflow-hidden mb-8 transition-transform group-hover:scale-105 shadow-lg">
              <img
                src="https://ext.same-assets.com/1022434225/3614584481.avif"
                alt="Bakery"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-elite-black text-3xl lg:text-4xl">
              Bakery
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
