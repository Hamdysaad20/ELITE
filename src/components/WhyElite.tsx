"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Star, ImageIcon, Coffee, Home, Zap, Leaf } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const FEATURE_KEYS = ["coffee", "cozy", "service", "local"] as const;
const CARD_NUMBERS = ["01", "02", "03", "04"] as const;
const CARD_ICONS = [Coffee, Home, Zap, Leaf] as const;

// Tinted gradient per image placeholder
const IMAGE_OVERLAYS = [
  "from-amber-950/50 to-amber-900/10",
  "from-rose-950/50 to-rose-900/10",
  "from-sky-950/50 to-sky-900/10",
  "from-emerald-950/50 to-emerald-900/10",
] as const;

export default function WhyElite() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
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

    if (!section || prefersReduced) return;

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
      className="bg-elite-burgundy py-16 sm:py-20 md:py-28 px-4 sm:px-6 overflow-hidden relative"
    >
      {/* Parallax blobs */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <div
          ref={(el) => {
            blobRefs.current[0] = el;
          }}
          className="absolute top-[10%] start-[5%] w-56 h-56 rounded-full bg-elite-cream/[0.03] blur-3xl"
        />
        <div
          ref={(el) => {
            blobRefs.current[1] = el;
          }}
          className="absolute bottom-[15%] end-[8%] w-72 h-72 rounded-full bg-elite-cream/[0.02] blur-3xl"
        />
        <div
          ref={(el) => {
            blobRefs.current[2] = el;
          }}
          className="absolute top-[55%] start-[55%] w-36 h-36 rounded-full bg-elite-cream/[0.04] blur-2xl"
        />
        <div className="absolute top-[22%] end-[28%] w-1.5 h-1.5 rounded-full bg-elite-cream/20" />
        <div className="absolute bottom-[32%] start-[18%] w-2 h-2 rounded-full bg-elite-cream/15" />
        <div className="absolute top-[68%] end-[42%] w-1 h-1 rounded-full bg-elite-cream/25" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div ref={headingRef} className="text-center mb-10 sm:mb-14">
          <p className="font-cabin text-elite-cream/40 text-[11px] sm:text-xs uppercase tracking-[0.22em] mb-3">
            {t("subtitle")}
          </p>
          <h2 className="font-calistoga text-elite-cream text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-tight tracking-[-0.02em]">
            {t("title")}
          </h2>
        </div>

        {/* Feature cards — 1-col mobile, 2-col sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = CARD_ICONS[i];
            return (
              <div
                key={key}
                ref={(el) => {
                  featureRefs.current[i] = el;
                }}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.09] bg-white/[0.07] cursor-default transition-transform duration-300 ease-out hover:-translate-y-1.5"
              >
                {/* ── Image placeholder ── */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.04]">
                  {/* Tinted gradient */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-70",
                      IMAGE_OVERLAYS[i],
                    )}
                  />

                  {/* Dot-grid texture */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, #fff 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Placeholder icon — centered */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                      <ImageIcon
                        className="w-5 h-5 text-elite-cream/30"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="font-cabin text-[9px] text-elite-cream/20 tracking-[0.18em] uppercase">
                      Image
                    </span>
                  </div>

                  {/* Card number watermark */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 end-3 font-bebas text-[3.25rem] leading-none text-elite-cream/[0.07] select-none"
                  >
                    {CARD_NUMBERS[i]}
                  </span>

                  {/* Hover overlay shine */}
                  <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* ── Card content ── */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/[0.18] transition-colors duration-300">
                      <Icon
                        className="w-[15px] h-[15px] text-elite-cream"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-cabin font-semibold text-elite-cream text-base sm:text-[17px] leading-snug pt-1">
                      {tFeatures(`${key}.title`)}
                    </h3>
                  </div>
                  <p className="font-cabin text-elite-cream/55 text-sm sm:text-[14.5px] leading-relaxed">
                    {tFeatures(`${key}.description`)}
                  </p>
                </div>

                {/* Bottom edge glow on hover */}
                <div className="absolute bottom-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-elite-cream/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            );
          })}
        </div>

        {/* ── Testimonial / Quote ── */}
        <div
          ref={quoteRef}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-elite-cream p-7 sm:p-10 md:p-12"
        >
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="absolute top-0 end-0 w-72 h-72 bg-elite-burgundy/[0.06] rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 start-0 w-56 h-56 bg-elite-burgundy/[0.04] rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10 flex flex-col sm:flex-row gap-7 sm:gap-10 items-start sm:items-center">
            {/* Quote text */}
            <div className="flex-1 min-w-0">
              <span className="font-calistoga text-7xl sm:text-8xl text-elite-burgundy/10 leading-none select-none block -mb-5">
                &ldquo;
              </span>
              <blockquote className="font-cabin text-elite-burgundy text-[15px] sm:text-base md:text-[17px] leading-relaxed mb-5">
                {t("quote")}
              </blockquote>
              <div className="flex items-center gap-1 mb-1.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="font-cabin text-elite-black/40 text-xs sm:text-sm">
                {t("rating")}
              </p>
            </div>

            {/* Vertical divider — desktop only */}
            <div
              aria-hidden="true"
              className="hidden sm:block w-px self-stretch bg-elite-burgundy/10 shrink-0"
            />

            {/* Author */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-3 shrink-0">
              <div className="w-11 h-11 rounded-full bg-elite-burgundy/10 flex items-center justify-center shrink-0">
                <span className="font-calistoga text-elite-burgundy text-lg leading-none">
                  E
                </span>
              </div>
              <div className="sm:text-center">
                <p className="font-cabin font-semibold text-elite-black text-sm sm:text-base">
                  {t("quoteAuthor")}
                </p>
                <p className="font-cabin text-elite-black/50 text-xs sm:text-sm">
                  {t("quoteDescriptor")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
