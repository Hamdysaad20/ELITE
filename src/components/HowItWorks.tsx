"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocalizedLink from "@/components/LocalizedLink";
import { useLandingReveal } from "@/hooks/useLandingReveal";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    key: "browse" as const,
    number: "01",
    href: "/menu",
    image: "/images/howitworks/fullmenu.png",
    objPos: "center 50%",
  },
  {
    key: "order" as const,
    number: "02",
    href: "/menu",
    image: "/images/HQ16by9/ModelHolding.jpg",
    objPos: "center 42%",
  },
  {
    key: "enjoy" as const,
    number: "03",
    href: "/menu",
    image: "/images/menaCloseup.png",
    objPos: "center 50%",
  },
] as const;

// Subtle warm bg shifts within the cream palette
const SECTION_BG = ["#f8f0d2", "#f4e8c4", "#f0e0b6"] as const;

/* ── Mobile card ── */
function MobileCard({
  step,
  t,
}: {
  step: (typeof STEPS)[number];
  t: ReturnType<typeof useTranslations<"howItWorks">>;
}) {
  return (
    <div className="min-w-[82vw] max-w-[300px] flex-shrink-0 snap-start">
      <div className="overflow-hidden rounded-3xl border border-elite-burgundy/8 bg-white shadow-sm">
        <div className="relative h-[200px] w-full">
          <Image
            src={step.image}
            alt={t(`steps.${step.key}.title`)}
            fill
            className="object-cover"
            style={{ objectPosition: step.objPos }}
            sizes="82vw"
          />
          <div className="absolute start-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-elite-burgundy shadow">
            <span className="font-cabin text-[11px] font-bold leading-none text-elite-cream">
              {step.number}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h3
            className="font-readex font-bold tracking-tight leading-none text-elite-black mb-2 rtl:tracking-normal"
            style={{ fontSize: "clamp(1.55rem, 3.5vw, 1.85rem)" }}
          >
            {t(`steps.${step.key}.title`)}
          </h3>
          <p className="mb-4 font-readex text-[13px] leading-relaxed text-elite-black/55">
            {t(`steps.${step.key}.description`)}
          </p>
          <LocalizedLink
            href={step.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-elite-burgundy/25 py-3 font-bebas text-[1.05rem] tracking-[0.1em] text-elite-burgundy transition-all duration-200 hover:border-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream active:scale-[0.97]"
          >
            {t(`steps.${step.key}.cta`)}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}

/* ── Section ── */
export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const t = useTranslations("howItWorks");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef],
    start: "top 88%",
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const texts = textRefs.current.filter(Boolean) as HTMLDivElement[];
    const wrappers = imgWrapperRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!pinRef.current || texts.length < 2 || wrappers.length < 2) return;

    // First image on top — highest z-index
    wrappers.forEach((w, i) => {
      w.style.zIndex = String(wrappers.length - i);
    });

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      // Hide all text panels except the first
      gsap.set(texts.slice(1), { autoAlpha: 0, y: 24 });
      gsap.set(wrappers, { clipPath: "inset(0% 0% 0% 0%)" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: `+=${window.innerHeight * (STEPS.length - 1)}`,
          pin: true,
          scrub: 0.5,
        },
      });

      wrappers.forEach((wrapper, i) => {
        if (i === wrappers.length - 1) return;
        const currentText = texts[i];
        const nextText = texts[i + 1];
        if (!currentText || !nextText) return;

        const label = `step${i}`;

        // Hold current step
        tl.to({}, { duration: 0.35 });

        // Transition: clip image + crossfade text + shift bg
        tl.addLabel(label);
        tl.to(
          wrapper,
          { clipPath: "inset(0% 0% 100% 0%)", duration: 1.2, ease: "none" },
          label,
        );
        tl.to(
          currentText,
          { autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.in" },
          label,
        );
        tl.to(
          nextText,
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
          `${label}+=0.35`,
        );
        tl.to(
          sectionRef.current,
          {
            backgroundColor: SECTION_BG[i + 1],
            duration: 1.2,
            ease: "power2.inOut",
          },
          label,
        );

        // Hold next step
        tl.to({}, { duration: 0.35 });
      });

      // Return to canonical cream so the wave divider after this section matches
      tl.to(sectionRef.current, {
        backgroundColor: SECTION_BG[0],
        duration: 0.5,
        ease: "power2.inOut",
      });

      return () => tl.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ backgroundColor: SECTION_BG[0] }}
    >
      {/* Watermark tiled logo */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: "url('/images/logo_noBG.png')",
          backgroundSize: "180px auto",
          backgroundRepeat: "repeat",
          opacity: 0.025,
          filter: "brightness(0)",
        }}
      />

      {/* ── Section heading ── */}
      <div className="relative z-10 mx-auto max-w-5xl overflow-hidden px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10 md:pb-16 md:pt-14">
        <div ref={headingRef} className="text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/12 bg-white/60 px-4 py-2 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/70">
            <Sparkles className="h-3.5 w-3.5" />
            {t("badge")}
          </span>
          <h2
            className="mt-2 font-readex font-bold leading-none tracking-tight text-elite-black rtl:tracking-normal"
            style={{ fontSize: "clamp(2.2rem, 6.5vw, 4.6rem)" }}
          >
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-md font-readex text-sm leading-relaxed text-elite-black/50 sm:text-base md:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* ── Desktop: text on top, full-width pinned image below ── */}
      <div
        ref={pinRef}
        className="relative z-10 hidden h-screen flex-col pt-6 lg:pt-10 md:flex"
      >
        {/* Text area — generous strip at top */}
        <div
          className="relative mx-auto w-full max-w-6xl px-6 sm:px-10"
          style={{ minHeight: "clamp(220px, 34vh, 380px)" }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className="absolute inset-0 flex items-center px-6 sm:px-10"
            >
              <div className="flex w-full items-end justify-between gap-8">
                <div className="min-w-0">
                  {/* Step number — ghost watermark */}
                  <span className="mb-3 block font-bebas text-[4.5rem] leading-none tracking-[0.12em] text-elite-burgundy/[0.08] lg:text-[5.5rem]">
                    {step.number}
                  </span>
                  {/* Title — Bebas for Latin, Readex Pro for Arabic */}
                  <h3
                    className="font-readex font-bold leading-[1] tracking-tight text-elite-black rtl:tracking-normal"
                    style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.8rem)" }}
                  >
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  {/* Short description */}
                  <p className="mt-3 max-w-xl font-readex text-base leading-[1.7] text-elite-black/50 sm:text-lg md:text-xl rtl:font-medium">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
                {/* CTA button */}
                <LocalizedLink
                  href={step.href}
                  className="group/cta flex-shrink-0 inline-flex items-center gap-2.5 rounded-2xl bg-elite-burgundy px-8 py-4 font-readex text-sm font-semibold tracking-wide text-elite-cream shadow-[0_6px_20px_rgba(139,38,53,0.2)] transition-all duration-200 hover:shadow-[0_10px_28px_rgba(139,38,53,0.3)] hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  {t(`steps.${step.key}.cta`)}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5 rtl:rotate-180" />
                </LocalizedLink>
              </div>
            </div>
          ))}
        </div>

        {/* Image area — full width, fills remaining space */}
        <div className="relative mx-auto w-full max-w-6xl flex-1 px-6 pb-8 sm:px-10 sm:pb-12">
          <div
            className="relative h-full overflow-hidden rounded-[1.6rem] sm:rounded-[2rem]"
            style={{
              boxShadow:
                "0 0 80px 24px rgba(248,240,210,0.55), 0 20px 56px rgba(14,7,9,0.10)",
            }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.key}
                ref={(el) => {
                  imgWrapperRefs.current[i] = el;
                }}
                className="absolute inset-0"
              >
                <Image
                  src={step.image}
                  alt={t(`steps.${step.key}.title`)}
                  fill
                  className="object-cover"
                  style={{ objectPosition: step.objPos }}
                  sizes="(min-width: 769px) 1140px"
                  priority={i === 0}
                />
                {/* Subtle bottom vignette */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 50%, rgba(8,3,5,0.28) 100%)",
                  }}
                  aria-hidden="true"
                />
              </div>
            ))}

            {/* ── Progressive blur on edges ── */}
            <div
              className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
              aria-hidden="true"
            >
              {/* Layer 1 — widest band, lightest blur */}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: "blur(1.5px)",
                  WebkitBackdropFilter: "blur(1.5px)",
                  maskImage:
                    "radial-gradient(ellipse 72% 65% at center, transparent 55%, black 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 72% 65% at center, transparent 55%, black 100%)",
                }}
              />
              {/* Layer 2 — medium */}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  maskImage:
                    "radial-gradient(ellipse 68% 58% at center, transparent 60%, black 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 68% 58% at center, transparent 60%, black 100%)",
                }}
              />
              {/* Layer 3 — stronger, narrower */}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  maskImage:
                    "radial-gradient(ellipse 62% 50% at center, transparent 70%, black 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 62% 50% at center, transparent 70%, black 100%)",
                }}
              />
              {/* Layer 4 — heaviest blur, very edges */}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  maskImage:
                    "radial-gradient(ellipse 56% 44% at center, transparent 78%, black 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 56% 44% at center, transparent 78%, black 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: horizontal snap-scroll ── */}
      <div className="relative z-10 pb-14 md:hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex snap-x snap-mandatory gap-4 px-4 pb-3">
            {STEPS.map((step) => (
              <MobileCard key={step.key} step={step} t={t} />
            ))}
            <div className="min-w-4 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
