'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Hero() {
  const leftCupRef = useRef(null);
  const centerCupRef = useRef(null);
  const rightCupRef = useRef(null);

  useEffect(() => {
    // Set initial state
    gsap.set([leftCupRef.current, centerCupRef.current, rightCupRef.current], {
      opacity: 0,
      y: 100
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline();

    // Animate cups in order: center, left, right
    tl.to(centerCupRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    })
    .to(leftCupRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.6") // Start 0.6 seconds before previous animation ends
    .to(rightCupRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.6"); // Start 0.6 seconds before previous animation ends
  }, []);

  return (
    <section className="bg-brewhaus-green flex flex-col max-h-[90vh]">
      {/* Main content area */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-20 min-h-[50vh] max-h-[60vh]">
        <h1 className="font-calistoga text-brewhaus-cream text-6xl md:text-7xl lg:text-8xl leading-tight max-w-4xl mb-6">
          Life Begins<br />
          After Coffee
        </h1>

        <p className="text-brewhaus-cream font-cabin text-xl md:text-2xl mb-10 max-w-2xl">
          Because great coffee is the start of something even greater.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 mb-12 w-full sm:w-auto">
          <button className="w-full sm:w-auto bg-brewhaus-cream text-brewhaus-green px-8 py-4 sm:px-6 sm:py-3 rounded-full font-cabin text-lg sm:text-base font-semibold hover:opacity-90 transition-opacity">
            Explore Menu
          </button>
          <button className="w-full sm:w-auto border-2 border-brewhaus-cream text-brewhaus-cream px-8 py-4 sm:px-6 sm:py-3 rounded-full font-cabin text-lg sm:text-base font-semibold hover:bg-brewhaus-cream hover:text-brewhaus-green transition-colors">
            Our Locations
          </button>
        </div>
      </div>

      {/* Coffee Cups Grid Section - Inspired by Brewhaus */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[24rem] bg-brewhaus-green flex-shrink-0">
        <div className="w-layout-blockcontainer container w-container mx-auto h-full max-w-6xl px-2 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-end justify-items-center h-full sm:-space-x-10 overflow-hidden">
          {/* Left Cup */}
          <div ref={leftCupRef} className="hidden sm:flex items-end justify-center transform -rotate-12 translate-y-8 sm:translate-y-10 md:translate-y-6 lg:translate-y-2 xl:translate-y-0">
            <div className="w-full max-w-40 sm:max-w-48 md:max-w-56 lg:max-w-64 xl:max-w-72 h-auto aspect-[4/5]">
              <img
                src="https://ext.same-assets.com/1022434225/3040081048.avif"
                alt="Just Coffee Cup"
                className="w-full h-full object-contain drop-shadow-2xl"
                loading="eager"
              />
            </div>
          </div>

          {/* Center Cup */}
          <div ref={centerCupRef} className="flex items-end justify-center z-10 translate-y-8 sm:translate-y-10 md:translate-y-6 lg:translate-y-2 xl:translate-y-0">
            <div className="w-full max-w-64 sm:max-w-72 md:max-w-80 lg:max-w-88 xl:max-w-96 h-auto aspect-[4/5]">
              <img
                src="https://ext.same-assets.com/1022434225/3705697434.avif"
                alt="Espresso Cup"
                className="w-full h-full object-contain drop-shadow-2xl"
                loading="eager"
              />
            </div>
          </div>

          {/* Right Cup */}
          <div ref={rightCupRef} className="hidden sm:flex items-end justify-center transform rotate-12 translate-y-8 sm:translate-y-10 md:translate-y-6 lg:translate-y-2 xl:translate-y-0">
            <div className="w-full max-w-40 sm:max-w-48 md:max-w-56 lg:max-w-64 xl:max-w-72 h-auto aspect-[4/5]">
              <img
                src="https://ext.same-assets.com/1022434225/515548484.avif"
                alt="Cold Brew Cup"
                className="w-full h-full object-contain drop-shadow-2xl"
                loading="eager"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Infinite Scroll Section */}
      <div className="bg-brewhaus-cream py-6 overflow-hidden w-full flex-shrink-0 relative z-10">
        <div className="marquee-container w-full">
          <div className="marquee-content">
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
