"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import LocalizedLink from "@/components/LocalizedLink";

gsap.registerPlugin(ScrollTrigger);

/* ── Hero background carousel ──────────────────────────────────────────
   objectPosition strategy:
   LTR (en): text/CTAs sit on the LEFT  → subjects land in the RIGHT 55–70 %
   RTL (ar): text/CTAs sit on the RIGHT → subjects land in the LEFT  30–45 %
   X positions are mirrored (X → 100-X) between the two directions so
   the visible window flips to the opposite side of each image.
   ─────────────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    // Subject (face + cup) at ~44 % of image width
    src: "/images/HQ16by9/MenaCloseMatcha.png",
    alt: "Elite Coffee — Faiyum, Egypt",
    ltr: {
      mobile: "object-[27%_38%]",
      tablet: "sm:object-[16%_32%]",
      desktop: "lg:object-[5%_28%]",
    },
    rtl: {
      mobile: "object-[73%_38%]",
      tablet: "sm:object-[84%_32%]",
      desktop: "lg:object-[95%_28%]",
    },
  },
  {
    // Subject (drink) at ~30 % of image width (LEFT-biased composition)
    src: "/images/HQ16by9/MICRO_LEFT_bobaspanish.png",
    alt: "Elite Coffee — Spanish Boba",
    ltr: {
      mobile: "object-[2%_42%]",
      tablet: "sm:object-[2%_38%]",
      desktop: "lg:object-[0%_35%]",
    },
    rtl: {
      mobile: "object-[98%_42%]",
      tablet: "sm:object-[98%_38%]",
      desktop: "lg:object-[100%_35%]",
    },
  },
  {
    // Subject (model) at ~50 % of image width
    src: "/images/HQ16by9/ModelHolding.png",
    alt: "Elite Coffee — Signature Drinks",
    ltr: {
      mobile: "object-[38%_38%]",
      tablet: "sm:object-[30%_34%]",
      desktop: "lg:object-[30%_30%]",
    },
    rtl: {
      mobile: "object-[62%_38%]",
      tablet: "sm:object-[70%_34%]",
      desktop: "lg:object-[70%_30%]",
    },
  },
] as const;

/* ── Showcase drink cards (bottom-right panel, desktop only) ── */
const HERO_SHOWCASE = [
  {
    key: "taro" as const,
    image: "/images/MicroTARO.png",
    objectPosition: "center 48%",
  },
  {
    key: "spanishBoba" as const,
    image: "/images/MICRObobaspanish.png",
    objectPosition: "45% 44%",
  },
] as const;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentSlide = useRef(0);
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRtl = locale === "ar";

  /* ── Magnetic CTA ── */
  const handleCtaMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const btn = ctaBtnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.22,
        y: (e.clientY - r.top - r.height / 2) * 0.22,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    [],
  );

  const handleCtaMouseLeave = useCallback(() => {
    gsap.to(ctaBtnRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.4)",
    });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Initialize slide opacities
    slideRefs.current.forEach((slide, i) => {
      if (slide) gsap.set(slide, { opacity: i === 0 ? 1 : 0 });
    });

    if (reduced) {
      gsap.set([eyebrowRef.current, bottomRef.current], { opacity: 1, y: 0 });
      gsap.set(titleRef.current?.querySelectorAll(".hero-word") ?? [], {
        opacity: 1,
        y: 0,
        rotateX: 0,
      });
    } else {
      gsap.set(eyebrowRef.current, { opacity: 0, y: -14 });
      gsap.set(titleRef.current?.querySelectorAll(".hero-word") ?? [], {
        opacity: 0,
        y: 72,
        rotateX: -38,
      });
      gsap.set(bottomRef.current, { opacity: 0, y: 28 });

      const tl = gsap.timeline({ delay: 0.06 });
      tl.to(
        eyebrowRef.current,
        { opacity: 1, y: 0, duration: 0.58, ease: "power3.out" },
        0,
      );
      tl.to(
        titleRef.current?.querySelectorAll(".hero-word") ?? [],
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.88,
          ease: "power3.out",
          stagger: 0.06,
        },
        0.14,
      );
      tl.to(
        bottomRef.current,
        { opacity: 1, y: 0, duration: 0.72, ease: "power3.out" },
        0.5,
      );

      if (section && photoRef.current) {
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 1.8,
          onUpdate: (self) =>
            gsap.set(photoRef.current, { y: self.progress * 65 }),
        });
      }
    }

    // Auto-advance carousel every 5 s with 1.3 s crossfade
    const advance = () => {
      const prev = currentSlide.current;
      const next = (prev + 1) % HERO_SLIDES.length;
      currentSlide.current = next;
      setActiveSlide(next);
      const prevEl = slideRefs.current[prev];
      const nextEl = slideRefs.current[next];
      if (prevEl)
        gsap.to(prevEl, { opacity: 0, duration: 1.3, ease: "power2.inOut" });
      if (nextEl)
        gsap.to(nextEl, { opacity: 1, duration: 1.3, ease: "power2.inOut" });
    };

    carouselTimer.current = setInterval(advance, 5000);

    return () => {
      if (carouselTimer.current) clearInterval(carouselTimer.current);
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  const renderWords = (text: string) =>
    text.split(" ").map((word, i, arr) => (
      <span
        key={i}
        className="hero-word inline-block"
        style={{ perspective: "600px" }}
      >
        {word}
        {i < arr.length - 1 ? "\u00A0" : ""}
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      dir={isRtl ? "rtl" : "ltr"}
      className="hero-section relative flex flex-col overflow-hidden bg-[#040203] min-h-[calc(68svh_-_var(--nav-height-mobile))] min-[641px]:min-h-[calc(100svh_-_var(--nav-height-desktop))]"
      aria-label="Homepage hero"
    >
      {/* ── Background carousel ── */}
      <div
        ref={photoRef}
        className="absolute inset-x-0 z-0 will-change-transform [top:10%] [bottom:-2%] sm:[top:-4%] sm:[bottom:-18%]"
      >
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="absolute inset-0"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover ${isRtl ? `${slide.rtl.mobile} ${slide.rtl.tablet} ${slide.rtl.desktop}` : `${slide.ltr.mobile} ${slide.ltr.tablet} ${slide.ltr.desktop}`}`}
            />
          </div>
        ))}
      </div>

      {/* ── Gradient: dark top → transparent centre → dark bottom ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,2,3,0.82) 0%, rgba(4,2,3,0.22) 28%, rgba(4,2,3,0.06) 46%, rgba(4,2,3,0.14) 62%, rgba(4,2,3,0.72) 82%, rgba(4,2,3,0.92) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Warm amber radial */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 38%, rgba(218,148,60,0.07) 0%, transparent 68%)",
        }}
        aria-hidden="true"
      />

      {/* Mobile text-area scrim — extra depth behind subtitle / CTAs on small screens */}
      <div
        className="sm:hidden absolute inset-x-0 bottom-0 z-[2] pointer-events-none"
        style={{
          height: "60%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(4,2,3,0.36) 32%, rgba(4,2,3,0.62) 62%, rgba(4,2,3,0.82) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.016]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-[5] flex flex-1 flex-col px-5 pt-8 pb-0 sm:pt-6 sm:px-10 lg:px-14">
        {/* ── Eyebrow pill ── */}
        <div
          ref={eyebrowRef}
          className="inline-flex self-start w-fit items-center gap-3 rounded-full border border-white/32 bg-black/52 px-4 py-2 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.38)]"
        >
          <div
            className="h-px w-6 flex-shrink-0 bg-white/55"
            aria-hidden="true"
          />
          <span className="font-cabin text-[9px] sm:text-[10px] font-semibold text-white tracking-[0.28em] uppercase select-none">
            <span className="sm:hidden">Premium Coffee</span>
            <span className="hidden sm:inline">
              Premium Coffee · Faiyum, Egypt
            </span>
          </span>
          <div
            className="h-px w-6 flex-shrink-0 bg-white/40"
            aria-hidden="true"
          />
        </div>

        {/* ── Brand mega-title ── */}
        <div className="mt-3 sm:mt-4">
          <div
            ref={titleRef}
            aria-label="ELITE COFFEE"
            style={{ lineHeight: 0.84 }}
          >
            <span
              className="font-bebas text-white uppercase block"
              style={{
                fontSize: "clamp(3.8rem, 18vw, 13.5rem)",
                letterSpacing: "0.04em",
                textShadow: "0 4px 32px rgba(0,0,0,0.55)",
              }}
            >
              {renderWords("ELITE")}
            </span>
            <span
              className="font-bebas uppercase block"
              style={{
                fontSize: "clamp(3.8rem, 18vw, 13.5rem)",
                letterSpacing: "0.04em",
                color: "rgba(248,228,196,0.97)",
                textShadow: "0 4px 32px rgba(0,0,0,0.50)",
              }}
            >
              {renderWords("COFFEE")}
            </span>
          </div>
        </div>

        {/* Spacer — subject shows through here */}
        <div className="flex-1 min-h-[1.5rem]" aria-hidden="true" />

        {/* ── Bottom block ── */}
        <div ref={bottomRef} className="pb-10 sm:pb-10 w-full">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            {/* ── Left: subtitle, rating, CTAs, indicators ── */}
            <div className="max-w-md">
              <p
                className="mb-5 sm:mb-4 font-cabin text-[0.96rem] leading-relaxed text-white sm:text-[1.06rem] max-w-xs sm:max-w-sm"
                style={{ textShadow: "0 2px 14px rgba(0,0,0,0.65)" }}
              >
                {t("subtitle")}
              </p>

              <div className="mb-6 sm:mb-5 inline-flex self-start w-fit items-center gap-2.5 rounded-full border border-white/28 bg-black/52 px-4 py-1.5 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                <span
                  className="text-[#FFD166] text-[12px] select-none"
                  aria-hidden="true"
                >
                  ★★★★★
                </span>
                <span className="font-cabin text-white text-[11px] sm:text-[12px] font-medium">
                  4.9 · {t("socialProof")}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-3">
                <div
                  ref={ctaBtnRef}
                  className="relative"
                  onMouseMove={handleCtaMouseMove}
                  onMouseLeave={handleCtaMouseLeave}
                >
                  <div className="absolute inset-0 rounded-full bg-elite-cream/16 animate-cta-pulse pointer-events-none" />
                  <LocalizedLink
                    href="/menu"
                    className="btn-shimmer inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-elite-cream px-9 py-[1.05rem] font-bebas text-[1.35rem] tracking-[0.1em] text-elite-black shadow-[0_14px_44px_rgba(0,0,0,0.38)] hover:bg-white hover:scale-[1.03] active:scale-95 transition-all duration-300 touch-manipulation"
                  >
                    {t("ctaExplore")}
                  </LocalizedLink>
                </div>

                <LocalizedLink
                  href="/auth/signin"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border-2 border-white/40 bg-black/36 px-8 py-[1.05rem] font-bebas text-[1.3rem] tracking-[0.1em] text-white hover:bg-black/52 hover:border-white/60 active:scale-95 transition-all duration-300 touch-manipulation backdrop-blur-sm"
                >
                  {t("ctaJoin")}
                </LocalizedLink>
              </div>

              {/* ── Slide progress indicators ── */}
              <div
                className="mt-6 sm:mt-5 flex items-center gap-2"
                aria-hidden="true"
              >
                {HERO_SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className="h-[3px] rounded-full transition-all duration-700 ease-in-out"
                    style={{
                      width: i === activeSlide ? "24px" : "6px",
                      background:
                        i === activeSlide
                          ? "rgba(255,255,255,0.82)"
                          : "rgba(255,255,255,0.28)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Right: drink showcase panel (md+ only) ── */}
            <div className="hidden md:block w-full max-w-[28rem] lg:max-w-[30rem]">
              <div className="rounded-[1.75rem] border border-white/22 bg-black/62 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl overflow-hidden">
                {/* ── Panel header ── */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Live dot */}
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5c87a] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f5c87a]" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-cabin text-[10px] font-bold uppercase tracking-[0.22em] text-white leading-none">
                        {t("showcase.badge")}
                      </p>
                      <p className="mt-0.5 font-cabin text-[11px] text-white/80 leading-snug truncate">
                        {t("showcase.subtitle")}
                      </p>
                    </div>
                  </div>
                  {/* CTA — solid cream, direct */}
                  <LocalizedLink
                    href="/menu"
                    className="flex-shrink-0 rounded-full bg-elite-cream px-3.5 py-1.5 font-cabin text-[11px] font-bold text-elite-black transition-all duration-200 hover:bg-white hover:scale-[1.03] active:scale-95 shadow-[0_2px_12px_rgba(0,0,0,0.28)]"
                  >
                    {t("showcase.cta")} {isRtl ? "←" : "→"}
                  </LocalizedLink>
                </div>

                {/* ── Drink cards ── */}
                <div className="grid grid-cols-2 divide-x divide-white/8">
                  {HERO_SHOWCASE.map((item) => (
                    <LocalizedLink
                      key={item.key}
                      href="/menu"
                      className="group block"
                    >
                      <article className="relative overflow-hidden">
                        <div className="relative aspect-[0.9/1]">
                          <Image
                            src={item.image}
                            alt={t(`showcase.items.${item.key}.name`)}
                            fill
                            sizes="(max-width: 767px) 1px, (max-width: 1023px) 14rem, 15rem"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                            style={{ objectPosition: item.objectPosition }}
                          />
                          {/* Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,2,3,0.96)] via-[rgba(4,2,3,0.28)] to-[rgba(4,2,3,0.18)]" />

                          {/* Category tag — top start */}
                          <div className="absolute top-2.5 start-2.5">
                            <span className="inline-block rounded-full border border-white/24 bg-black/52 px-2 py-0.5 font-cabin text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                              {t(`showcase.items.${item.key}.tag`)}
                            </span>
                          </div>

                          {/* Arrow icon — top end, reveals on hover */}
                          <div className="absolute top-2.5 end-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/22 bg-black/44 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg
                              className={`h-3 w-3 text-white${isRtl ? " scale-x-[-1]" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 17L17 7M17 7H7M17 7v10"
                              />
                            </svg>
                          </div>

                          {/* Text — bottom */}
                          <div className="absolute inset-x-0 bottom-0 p-3">
                            <p
                              className="font-bebas text-[1.18rem] leading-none tracking-[0.06em] text-white"
                              style={{
                                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                              }}
                            >
                              {t(`showcase.items.${item.key}.name`)}
                            </p>
                            {/* Ingredient descriptors */}
                            <p className="mt-1 font-cabin text-[10px] leading-snug text-white/88">
                              {t(`showcase.items.${item.key}.note`)}
                            </p>
                            {/* Hover hint */}
                            <p className="mt-1 font-cabin text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f5c87a] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Tap to order {isRtl ? "←" : "→"}
                            </p>
                          </div>
                        </div>
                      </article>
                    </LocalizedLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Wave: dark → cream ── */}
      <div className="wave-divider bg-transparent -mb-px relative z-10">
        <svg
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-14 md:h-16"
        >
          <path
            d="M0,0 C360,6 720,64 1200,58 S1440,0 1440,0 L1440,64 L0,64 Z"
            fill="var(--elite-cream)"
          />
        </svg>
      </div>

      {/* ── Cream marquee band ── */}
      <div className="bg-elite-cream py-3 md:py-4 overflow-hidden w-full flex-shrink-0 relative z-10">
        <div className="marquee-container w-full">
          <div className="marquee-content text-xs sm:text-sm md:text-[15px]">
            {[
              { icon: "🌎", text: t("marquee.globalFlavor") },
              { icon: "☕", text: t("marquee.friendlyBaristas") },
              { icon: "⭐", text: t("marquee.greatCoffee") },
              { icon: "⚡", text: t("marquee.fastService") },
              { icon: "🏠", text: t("marquee.cozySpace") },
              { icon: "📸", text: t("marquee.handcraftedDrinks") },
              { icon: "🏆", text: t("marquee.localRoasts") },
            ]
              .flatMap((item) => [item, item, item])
              .map((item, index) => (
                <div className="marquee-item" key={`${item.text}-${index}`}>
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
