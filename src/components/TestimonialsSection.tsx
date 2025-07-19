'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Simple fade in for image only
      gsap.set(imageRef.current, {
        opacity: 0,
        y: 20
      });
      
      gsap.to(imageRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
      return;
    }

    // Enhanced animations for image only
    // Set initial states for image
    gsap.set(imageRef.current, {
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

    // Animate image with 3D effect
    tl.to(imageRef.current, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 1,
      ease: "power2.out"
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const testimonials = [
    {
      quote: "The coffee here is absolutely incredible. Every sip feels like a moment of pure joy. The baristas really know their craft and it shows in every cup.",
      author: "Sarah Chen",
      descriptor: "Coffee Enthusiast",
      rating: 5
    },
    {
      quote: "This place has become my second home. The atmosphere is so welcoming and the pastries are to die for. Perfect spot for working or catching up with friends.",
      author: "Marcus Rodriguez",
      descriptor: "Regular Customer",
      rating: 5
    },
    {
      quote: "I love how they source everything locally. You can taste the difference in quality. Plus, the staff remembers your name and preferences.",
      author: "Emma Thompson",
      descriptor: "Local Resident",
      rating: 5
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-200"}>
        ★
      </span>
    ));
  };

  return (
    <section ref={sectionRef} className="bg-elite-cream relative overflow-hidden py-12 lg:py-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-elite-burgundy rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-elite-cream rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-calistoga text-elite-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-6">
            What People<br />
            <span className="text-elite-burgundy">Love About Us</span>
          </h2>
          <p className="text-elite-black font-cabin text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Real stories from real people who've made Elite their daily ritual
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Left Column - Testimonials */}
          <div className="space-y-6 flex flex-col justify-center min-h-[600px] lg:min-h-[700px] xl:min-h-[800px]">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Quote Icon */}
                <div className="text-elite-burgundy text-3xl font-calistoga mb-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  "
                </div>

                {/* Quote Text */}
                <p className="text-elite-black font-cabin text-base leading-relaxed mb-4">
                  {testimonial.quote}
                </p>

                {/* Author Info and Rating */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-elite-black font-cabin font-semibold text-sm">
                      {testimonial.author}
                    </p>
                    <p className="text-elite-black/70 font-cabin text-xs">
                      {testimonial.descriptor}
                    </p>
                  </div>
                  <div className="flex items-center text-sm">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Right Column - Single Image */}
          <div className="lg:col-span-1 h-full">
            <div 
              ref={imageRef}
              className="relative group rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 h-full min-h-[600px] lg:min-h-[700px] xl:min-h-[800px]"
            >
              <img
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=800&fit=crop"
                alt="Barista crafting a beautiful latte with precision and care"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 z-20">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                  <p className="text-elite-black font-cabin text-sm font-medium">Crafted with Love</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 