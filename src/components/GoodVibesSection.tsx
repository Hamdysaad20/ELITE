'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function GoodVibesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Simple fade in for images only
      gsap.set(imageRefs.current, {
        opacity: 0,
        y: 20
      });
      
      gsap.to(imageRefs.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
      return;
    }

    // Enhanced animations for images only
    // Set initial states for images
    gsap.set(imageRefs.current, {
      opacity: 0,
      scale: 0.8,
      rotationY: -15
    });

    // Create main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        toggleActions: "play none none none" // Only play once
      }
    });

    // Animate images with 3D effect and stagger
    tl.to(imageRefs.current, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power2.out"
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const features = [
    {
      icon: "☕",
      text: "Great Coffee, Tasty Sips",
      description: "Expertly crafted beverages with premium beans"
    },
    {
      icon: "♥",
      text: "Warm, Cozy Atmosphere",
      description: "A welcoming space that feels like home"
    },
    {
      icon: "😊",
      text: "Speedy Service with a Smile",
      description: "Quick, friendly service every time"
    },
    {
      icon: "🏠",
      text: "Local & Sustainable",
      description: "Supporting local farmers and eco-friendly practices"
    }
  ];

  return (
    <section ref={sectionRef} className="bg-elite-cream relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-elite-burgundy rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-elite-cream rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto py-12 px-6 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text and Features */}
          <div className="space-y-8">
            {/* Main Heading and Description */}
            <div className="space-y-6">
              <h2 className="font-calistoga text-elite-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                Good Vibes.<br />
                <span className="text-elite-burgundy">Great Coffee.</span>
              </h2>
              <p className="text-elite-black font-cabin text-lg md:text-xl leading-relaxed max-w-lg">
                At Elite, we serve great coffee and fresh pastries with care and passion, 
                creating a warm, cozy space that feels like home.
              </p>
            </div>

            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300 block">
                        {feature.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-cabin text-elite-black text-lg font-semibold mb-1 group-hover:text-elite-burgundy transition-colors duration-300">
                        {feature.text}
                      </h3>
                      <p className="text-elite-black/70 font-cabin text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Enhanced Images Layout */}
          <div 
            ref={imagesRef} 
            className="relative grid grid-cols-2 gap-4 lg:gap-6 h-[400px] lg:h-[500px] xl:h-[600px]"
          >
            {/* Left Column - Barista Image */}
            <div 
              ref={(el) => { imageRefs.current[0] = el; }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
              <img
                src="https://cdn.prod.website-files.com/67fcb54501dc826cf4f8bfe9/67fd11bfc82841763bc93a7b_medium-shot-barista-with-mask-preparing-coffee.avif"
                alt="Barista preparing coffee with care and expertise"
                className="w-full h-full object-cover rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
                              <div className="absolute bottom-4 left-4 z-20">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                    <p className="text-elite-black font-cabin text-sm font-medium">Expert Baristas</p>
                  </div>
                </div>
            </div>

            {/* Right Column - Two Images Stacked */}
            <div className="space-y-4 lg:space-y-6 h-full flex flex-col">
              {/* Top Right - Cafe Interior */}
              <div 
                ref={(el) => { imageRefs.current[1] = el; }}
                className="relative group flex-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
                <img
                  src="https://cdn.prod.website-files.com/67fcb54501dc826cf4f8bfe9/67fd11bf98dbe39dd2a370be_interior-shot-cafe-with-chairs-near-bar-with-wooden-tables.avif"
                  alt="Cozy cafe interior with warm lighting and comfortable seating"
                  className="w-full h-full object-cover rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 z-20">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                    <p className="text-elite-black font-cabin text-sm font-medium">Cozy Space</p>
                  </div>
                </div>
              </div>

              {/* Bottom Right - Coffee Cup */}
              <div 
                ref={(el) => { imageRefs.current[2] = el; }}
                className="relative group flex-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
                <img
                  src="https://cdn.prod.website-files.com/67fcb54501dc826cf4f8bfe9/67fd11fedcb344bd7472203b_white-ceramic-teacup-brown-surface.avif"
                  alt="Beautiful handcrafted coffee with latte art"
                  className="w-full h-full object-cover rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 z-20">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                    <p className="text-elite-black font-cabin text-sm font-medium">Handcrafted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 