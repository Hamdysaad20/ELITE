"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";

gsap.registerPlugin(ScrollTrigger);

const FEATURE_KEYS = ["coffee", "cozy", "service", "local"] as const;
const FEATURE_EMOJIS = ["☕", "🏠", "⚡", "🌿"];

export default function WhyElite() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quoteRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<(SVGSVGElement | null)[]>([]);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const t = useTranslations("whyElite");
  const tFeatures = useTranslations("goodVibes.features");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef, quoteRef],
    staggerTargets: [featureRefs.current],
    start: "top 88%",
  });

  useEffect(() => {
    const section = sectionRef.current;
    const blobs = blobRefs.current.filter(Boolean);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!section || prefersReduced) {
      return;
    }

    const triggers = blobs.map((blob, i) =>
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const speed = [0.3, -0.2, 0.15][i % 3];
          gsap.set(blob, {
            y: self.progress * 80 * speed,
            x: self.progress * 40 * (i % 2 === 0 ? 1 : -1),
          });
        },
      }),
    );

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-elite-burgundy py-14 sm:py-20 md:py-28 px-4 sm:px-6 overflow-hidden relative will-change-transform"
    >
      {/* Floating decorative shapes — parallax driven */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          ref={(el) => {
            blobRefs.current[0] = el;
          }}
          className="absolute top-[15%] left-[8%] w-24 h-24 rounded-full bg-elite-cream/[0.04] blur-xl"
        />
        <div
          ref={(el) => {
            blobRefs.current[1] = el;
          }}
          className="absolute bottom-[20%] right-[10%] w-32 h-32 rounded-full bg-elite-cream/[0.03] blur-2xl"
        />
        <div
          ref={(el) => {
            blobRefs.current[2] = el;
          }}
          className="absolute top-[60%] left-[60%] w-16 h-16 rounded-full bg-elite-cream/[0.05] blur-lg"
        />
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full bg-elite-cream/20 animate-float-slow" />
        <div className="absolute bottom-[35%] left-[15%] w-2 h-2 rounded-full bg-elite-cream/15 animate-float-reverse" />
        <div className="absolute top-[70%] right-[35%] w-1 h-1 rounded-full bg-elite-cream/25 animate-float" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div ref={headingRef} className="text-center mb-12 sm:mb-16">
          <h2 className="font-calistoga text-elite-cream text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] mb-3 sm:mb-4">
            {t("title")}
          </h2>
          <p className="font-cabin text-elite-cream/60 text-sm sm:text-base md:text-lg max-w-md mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Content: Features + Quote */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 flex-1">
            {FEATURE_KEYS.map((key, i) => (
              <div
                key={key}
                ref={(el) => {
                  featureRefs.current[i] = el;
                }}
                className="glow-card bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 hover:bg-white/[0.18] hover:-translate-y-1 transition-all duration-300 group cursor-default"
                style={{ transformStyle: "preserve-3d" }}
              >
                <span className="text-3xl sm:text-4xl block mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 origin-center">
                  {FEATURE_EMOJIS[i]}
                </span>
                <h3 className="font-cabin font-semibold text-elite-cream text-sm sm:text-base md:text-[17px] mb-1.5 leading-snug">
                  {tFeatures(`${key}.title`)}
                </h3>
                <p className="font-cabin text-elite-cream/60 text-xs sm:text-sm leading-relaxed">
                  {tFeatures(`${key}.description`)}
                </p>
              </div>
            ))}
          </div>

          {/* Quote Card */}
          <div
            ref={quoteRef}
            className="bg-elite-cream rounded-3xl p-7 sm:p-9 flex flex-col justify-center lg:max-w-sm lg:min-w-[320px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-elite-burgundy/[0.04] rounded-full blur-3xl pointer-events-none" />
            <span className="font-calistoga text-6xl sm:text-7xl text-elite-burgundy/15 leading-none select-none relative z-10">
              &ldquo;
            </span>
            <blockquote className="font-cabin text-elite-burgundy text-[15px] sm:text-base md:text-[17px] leading-relaxed -mt-5 mb-6 relative z-10">
              {t("quote")}
            </blockquote>
            <div className="mb-4 relative z-10">
              <p className="font-cabin font-bold text-elite-black text-sm sm:text-base">
                {t("quoteAuthor")}
              </p>
              <p className="font-cabin text-elite-black/50 text-xs sm:text-sm">
                {t("quoteDescriptor")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mb-2.5 relative z-10">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  ref={(el) => {
                    starsRef.current[star - 1] = el;
                  }}
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="font-cabin text-elite-black/40 text-xs sm:text-sm relative z-10">
              {t("rating")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
