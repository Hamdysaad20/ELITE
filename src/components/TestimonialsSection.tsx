"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("testimonials");

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      // Simple fade in for image only
      gsap.set(imageRef.current, {
        opacity: 0,
        y: 20,
      });

      gsap.to(imageRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
      return;
    }

    // Enhanced animations for image only
    // Set initial states for image
    gsap.set(imageRef.current, {
      opacity: 0,
      scale: 0.8,
      rotationY: -15,
    });

    // Create main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        toggleActions: "play none none none", // Only play once
      },
    });

    // Animate image with 3D effect
    tl.to(imageRef.current, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 1,
      ease: "power2.out",
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const testimonials = [
    {
      quote: t("items.0.quote"),
      author: "Sarah Chen",
      descriptor: t("items.0.descriptor"),
      rating: 5,
    },
    {
      quote: t("items.1.quote"),
      author: "Marcus Rodriguez",
      descriptor: t("items.1.descriptor"),
      rating: 5,
    },
    {
      quote: t("items.2.quote"),
      author: "Emma Thompson",
      descriptor: t("items.2.descriptor"),
      rating: 5,
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-200"}
      >
        ★
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      className="bg-elite-cream relative overflow-hidden py-12 lg:py-20"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-elite-burgundy rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-elite-cream rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="font-calistoga text-elite-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-4 sm:mb-6">
            {t("titleLine1")}
            <br />
            <span className="text-elite-burgundy">{t("titleLine2")}</span>
          </h2>
          <p className="text-elite-black font-cabin text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto px-4">
            {t("subtitle")}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-stretch">
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
                alt={t("imageAlt")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 z-20">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                  <p className="text-elite-black font-cabin text-sm font-medium">
                    {t("imageLabel")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
