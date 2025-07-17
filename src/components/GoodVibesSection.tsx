'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function GoodVibesSection() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial state - scale down to 0
    gsap.set([headingRef.current, descriptionRef.current, featuresRef.current, imagesRef.current], {
      scale: 0,
      opacity: 0
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: headingRef.current,
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none"
      }
    });

    // Animate elements in sequence
    tl.to(headingRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    })
    .to(descriptionRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.4")
    .to(featuresRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.4")
    .to(imagesRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.4");
  }, []);

  const features = [
    {
      icon: "☕",
      text: "Great Coffee, Tasty Sips"
    },
    {
      icon: "♥",
      text: "Warm, Cozy Atmosphere"
    },
    {
      icon: "😊",
      text: "Speedy Service with a Smile"
    },
    {
      icon: "🏠",
      text: "Local & Sustainable"
    }
  ];

  return (
    <section className="bg-brewhaus-cream py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start h-full">
          {/* Left Column - Text and Features Grid */}
          <div className="space-y-6 h-full flex flex-col justify-between">
            {/* Main Heading and Description */}
            <div className="space-y-4">
              <h2 ref={headingRef} className="font-calistoga text-brewhaus-green text-4xl md:text-5xl lg:text-6xl leading-tight">
                Good Vibes.<br />Great Coffee.
              </h2>
              <p ref={descriptionRef} className="text-brewhaus-green font-cabin text-lg md:text-xl leading-relaxed">
                At Brewhaus, we serve great coffee and fresh pastries with care and passion, creating a warm, cozy space that feels like home.
              </p>
            </div>

            {/* Features Grid - 2x2 Equal Squares */}
            <div ref={featuresRef} className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-3">
                  <div className="w-14 h-14 bg-brewhaus-green rounded-full flex items-center justify-center mb-3">
                    <span className="text-white text-xl">{feature.icon}</span>
                  </div>
                  <p className="font-cabin text-brewhaus-green text-sm md:text-base font-medium leading-tight">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Images Layout */}
          <div ref={imagesRef} className="grid grid-cols-2 gap-4 h-full">
            {/* Left Column - Barista Image (Full Height) */}
            <div className="h-full rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://cdn.prod.website-files.com/67fcb54501dc826cf4f8bfe9/67fd11bfc82841763bc93a7b_medium-shot-barista-with-mask-preparing-coffee.avif"
                alt="Barista preparing coffee"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Column - Two Images Stacked */}
            <div className="space-y-4 h-full flex flex-col">
              {/* Top Right - Cafe Interior */}
              <div className="flex-1 rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://cdn.prod.website-files.com/67fcb54501dc826cf4f8bfe9/67fd11bf98dbe39dd2a370be_interior-shot-cafe-with-chairs-near-bar-with-wooden-tables.avif"
                  alt="Cafe interior with cozy atmosphere"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Right - Coffee Cup */}
              <div className="flex-1 rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://cdn.prod.website-files.com/67fcb54501dc826cf4f8bfe9/67fd11fedcb344bd7472203b_white-ceramic-teacup-brown-surface.avif"
                  alt="Beautiful coffee cup with latte art"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 