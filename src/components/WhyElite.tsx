"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Star, Coffee, Home, Zap, Leaf } from "lucide-react";
import Image from "next/image";
import { useLandingReveal } from "@/hooks/useLandingReveal";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { key: "coffee" as const, Icon: Coffee, shortLabel: "Great Coffee" },
  { key: "cozy" as const, Icon: Home, shortLabel: "Cozy Space" },
  { key: "service" as const, Icon: Zap, shortLabel: "Fast Service" },
  { key: "local" as const, Icon: Leaf, shortLabel: "Local & Fresh" },
] as const;

export default function WhyElite() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  const t = useTranslations("whyElite");
  const tF = useTranslations("goodVibes.features");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef, gridRef],
    start: "top 86%",
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
        scrub: 1.2,
        onUpdate: (self) => {
          const speed = [0.22, -0.16, 0.1][i % 3];
          gsap.set(blob, { y: self.progress * 60 * speed });
        },
      }),
    );

    return () => triggers.forEach((tr) => tr.kill());
  }, []);

  return (
    <section
      ref={sectionRef}
      dir={dir}
      className="relative overflow-hidden bg-elite-burgundy px-4 py-12 sm:px-6 sm:py-20 md:py-28"
    >
      {/* Ambient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {[
          "absolute start-[2%] top-[6%] h-72 w-72 bg-white/[0.022] blur-3xl",
          "absolute bottom-[10%] end-[4%] h-96 w-96 bg-white/[0.015] blur-3xl",
          "absolute start-[45%] top-[40%] h-48 w-48 bg-white/[0.028] blur-2xl",
        ].map((cls, i) => (
          <div
            key={i}
            ref={(el) => {
              blobRefs.current[i] = el;
            }}
            className={cn("rounded-full", cls)}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div ref={headingRef} className="mb-8 text-center sm:mb-12">
          <p className="mb-3 font-cabin text-[11px] uppercase tracking-[0.26em] text-elite-cream/40 sm:text-xs">
            {t("subtitle")}
          </p>
          <h2 className="font-calistoga text-3xl leading-tight tracking-[-0.02em] text-elite-cream sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            {t("title")}
          </h2>
        </div>

        {/* ── MOBILE layout: compact hero card + 2×2 icon grid ── */}
        <div ref={gridRef} className="block lg:hidden">
          {/* Hero image — shorter on mobile */}
          <div className="group relative h-52 w-full overflow-hidden rounded-2xl sm:h-64">
            <Image
              src="/images/ourplace/fc58696a-aab2-4167-b896-d955f68c8da4.JPG"
              alt="Elite cafe — guests enjoying the space"
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            {/* Live badge */}
            <div className="absolute start-4 top-4">
              <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-cabin text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                  Our place
                </span>
              </div>
            </div>

            {/* Bottom: name + stars */}
            <div className="absolute bottom-0 start-0 end-0 p-4">
              <p className="font-calistoga text-xl leading-snug text-white">
                Faiyum Governorate Club
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="font-cabin text-xs text-white/65">
                  {t("rating")}
                </span>
              </div>
            </div>
          </div>

          {/* 2×2 feature icon grid */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {FEATURES.map(({ key, Icon, shortLabel }) => (
              <div
                key={key}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.06] px-3 py-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-elite-cream/10">
                  <Icon
                    className="h-3 w-3 text-elite-cream"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <p className="font-cabin text-[11.5px] font-semibold leading-snug text-elite-cream whitespace-nowrap">
                  {shortLabel}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP layout: original bento grid (lg+) ── */}
        <div className="hidden lg:grid grid-cols-2 gap-4 items-start">
          {/* LEFT: Hero image tall */}
          <div className="group relative min-h-[600px] overflow-hidden rounded-3xl">
            <Image
              src="/images/ourplace/fc58696a-aab2-4167-b896-d955f68c8da4.JPG"
              alt="Elite cafe — guests enjoying the space"
              fill
              sizes="50vw"
              priority
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            <div className="absolute start-5 top-5">
              <div className="flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-cabin text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                  Our place
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 start-0 end-0 p-5 sm:p-7">
              <p className="font-calistoga text-2xl leading-snug text-white sm:text-3xl">
                Faiyum Governorate Club
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="font-cabin text-xs text-white/65">
                  {t("rating")}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: 2×2 bento */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {/* Feature pills — full width */}
            <div className="flex flex-col gap-2.5 sm:col-span-2">
              {FEATURES.map(({ key, Icon }) => (
                <div
                  key={key}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-4 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.10]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-elite-cream/10 transition-colors duration-300 group-hover:bg-elite-cream/[0.20]">
                    <Icon
                      className="h-4 w-4 text-elite-cream"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="font-cabin text-[14px] font-semibold leading-snug text-elite-cream">
                      {tF(`${key}.title`)}
                    </p>
                    <p className="mt-0.5 truncate font-cabin text-[12.5px] leading-snug text-elite-cream/45">
                      {tF(`${key}.description`)}
                    </p>
                  </div>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.12] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <svg
                      viewBox="0 0 10 10"
                      className="h-2.5 w-2.5"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 5h4M5.5 3l2 2-2 2" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Drinks image */}
            <div className="group relative aspect-square overflow-hidden rounded-3xl sm:aspect-auto sm:min-h-[200px]">
              <Image
                src="/images/ourplace/drinksList.png"
                alt="Elite signature drinks lineup at golden hour"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-4 start-4">
                <p className="font-cabin text-[9px] uppercase tracking-[0.22em] text-white/55">
                  Signature
                </p>
                <p className="font-calistoga text-base leading-tight text-white">
                  Crafted Drinks
                </p>
              </div>
            </div>

            {/* Quote card */}
            <div className="relative overflow-hidden rounded-3xl bg-elite-cream p-5 sm:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute end-0 top-0 h-48 w-48 rounded-full bg-elite-burgundy/[0.07] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 start-0 h-36 w-36 rounded-full bg-elite-burgundy/[0.04] blur-3xl"
              />

              <div className="relative z-10 flex h-full flex-col text-start">
                <div className="mb-3 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <span className="-mb-3 block select-none font-calistoga text-6xl leading-none text-elite-burgundy/[0.12]">
                  &ldquo;
                </span>

                <blockquote className="flex-1 font-cabin text-[13.5px] leading-relaxed text-elite-burgundy sm:text-sm">
                  {t("quote")}
                </blockquote>

                <div className="my-4 h-px w-8 rounded-full bg-elite-burgundy/15" />

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elite-burgundy/10">
                    <span className="font-calistoga text-sm leading-none text-elite-burgundy">
                      E
                    </span>
                  </div>
                  <div className="min-w-0 text-start">
                    <p className="truncate font-cabin text-xs font-semibold text-elite-black">
                      {t("quoteAuthor")}
                    </p>
                    <p className="truncate font-cabin text-[11px] text-elite-black/45">
                      {t("quoteDescriptor")}
                    </p>
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
