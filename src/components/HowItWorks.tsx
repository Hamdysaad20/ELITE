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
    emoji: "☕",
    href: "/menu",
    image: "/images/howitworks/fullmenu.png",
    objPos: "center 50%",
  },
  {
    key: "order" as const,
    number: "02",
    emoji: "🛒",
    href: "/menu",
    image: "/images/HQ16by9/ModelHolding.png",
    objPos: "center 42%",
  },
  {
    key: "enjoy" as const,
    number: "03",
    emoji: "✨",
    href: "/menu",
    image: "/images/menaCloseup.png",
    objPos: "center 50%",
  },
] as const;

// Subtle warm bg shifts staying within the cream palette
const SECTION_BG = ["#FDF5E6", "#F8EDD8", "#F3E4C8"] as const;

/* ── Reusable tag chip ─────────────────────────────────────── */
function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-elite-burgundy/15 bg-elite-burgundy/[0.06] px-3 py-1.5 font-cabin text-[11px] font-semibold tracking-wide text-elite-burgundy/75">
      {label}
    </span>
  );
}

/* ── Desktop left-panel text block per step ─────────────────── */
function StepText({
  step,
  index,
  total,
  t,
}: {
  step: (typeof STEPS)[number];
  index: number;
  total: number;
  t: ReturnType<typeof useTranslations<"howItWorks">>;
}) {
  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <div className="relative" style={{ maxWidth: "420px" }}>
        {/* Ghost huge step number — decorative backdrop */}
        <span
          className="pointer-events-none absolute select-none font-bebas leading-none text-elite-burgundy/[0.055]"
          style={{
            fontSize: "clamp(9rem, 18vw, 14rem)",
            top: "-1.5rem",
            insetInlineStart: "-1.5rem",
            zIndex: 0,
          }}
          aria-hidden="true"
        >
          {step.number}
        </span>

        <div className="relative z-10">
          {/* ── Step counter + decorative line ── */}
          <div className="mb-6 flex items-center gap-3">
            <span
              className="h-px w-7 bg-elite-burgundy/35"
              aria-hidden="true"
            />
            <span className="font-cabin text-[10.5px] font-bold uppercase tracking-[0.32em] text-elite-burgundy/50">
              Step {index + 1} / {total}
            </span>
          </div>

          {/* ── Emoji icon in styled pill ── */}
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-elite-burgundy/12 bg-white/70 text-2xl shadow-sm backdrop-blur-sm">
            {step.emoji}
          </div>

          {/* ── Step title ── */}
          <h3
            className="font-bebas uppercase leading-[0.92] tracking-[0.05em] text-elite-black mb-1"
            style={{ fontSize: "clamp(2.2rem, 3.8vw, 3.2rem)" }}
          >
            {t(`steps.${step.key}.title`)}
          </h3>

          {/* ── Arabic subtitle ── */}
          <p
            dir="rtl"
            lang="ar"
            className="font-tajawal text-sm font-semibold text-elite-burgundy/50 mb-5"
          >
            {t(`steps.${step.key}.arabicTitle`)}
          </p>

          {/* ── Gradient divider ── */}
          <div
            className="mb-5 h-px w-3/4"
            style={{
              background:
                "linear-gradient(to right, rgba(139,38,53,0.25), transparent)",
            }}
            aria-hidden="true"
          />

          {/* ── Description ── */}
          <p className="mb-6 font-cabin text-[14.5px] leading-relaxed text-elite-black/55">
            {t(`steps.${step.key}.description`)}
          </p>

          {/* ── Feature tags ── */}
          <div className="mb-7 flex flex-wrap gap-2">
            <Tag label={t(`steps.${step.key}.tag1`)} />
            <Tag label={t(`steps.${step.key}.tag2`)} />
            <Tag label={t(`steps.${step.key}.tag3`)} />
          </div>

          {/* ── CTA ── */}
          <LocalizedLink
            href={step.href}
            className="group/cta inline-flex items-center gap-2.5 rounded-2xl bg-elite-burgundy px-7 py-3.5 font-bebas text-[1.05rem] tracking-[0.1em] text-elite-cream shadow-[0_6px_24px_rgba(139,38,53,0.22)] transition-all duration-200 hover:shadow-[0_10px_32px_rgba(139,38,53,0.32)] hover:-translate-y-0.5 active:scale-[0.97]"
          >
            {t(`steps.${step.key}.cta`)}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5 rtl:rotate-180" />
          </LocalizedLink>

          {/* ── Progress dots ── */}
          <div className="mt-8 flex items-center gap-2">
            {STEPS.map((_, j) => (
              <span
                key={j}
                className={[
                  "rounded-full transition-all duration-300",
                  j === index
                    ? "h-2 w-6 bg-elite-burgundy"
                    : "h-1.5 w-1.5 bg-elite-burgundy/20",
                ].join(" ")}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile card ────────────────────────────────────────────── */
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
        {/* Photo */}
        <div className="relative h-[200px] w-full">
          <Image
            src={step.image}
            alt={t(`steps.${step.key}.title`)}
            fill
            className="object-cover"
            style={{ objectPosition: step.objPos }}
            sizes="82vw"
          />
          {/* Step number badge */}
          <div className="absolute start-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-elite-burgundy shadow">
            <span className="font-cabin text-[11px] font-bold leading-none text-elite-cream">
              {step.number}
            </span>
          </div>
          {/* Emoji badge */}
          <div className="absolute end-3.5 top-3.5 z-10 flex h-9 min-w-[2.25rem] items-center justify-center rounded-2xl bg-white/85 px-2 text-base shadow-sm backdrop-blur-sm">
            {step.emoji}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <h3
            className="font-bebas uppercase tracking-[0.06em] leading-none text-elite-black mb-1"
            style={{ fontSize: "clamp(1.55rem, 3.5vw, 1.85rem)" }}
          >
            {t(`steps.${step.key}.title`)}
          </h3>
          <p
            dir="rtl"
            lang="ar"
            className="mb-3 font-tajawal text-sm font-semibold text-elite-burgundy/50"
          >
            {t(`steps.${step.key}.arabicTitle`)}
          </p>
          <p className="mb-4 font-cabin text-[13px] leading-relaxed text-elite-black/55">
            {t(`steps.${step.key}.description`)}
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Tag label={t(`steps.${step.key}.tag1`)} />
            <Tag label={t(`steps.${step.key}.tag2`)} />
            <Tag label={t(`steps.${step.key}.tag3`)} />
          </div>
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

/* ── Section ─────────────────────────────────────────────────── */
export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
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

    const wrappers = imgWrapperRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!archRef.current || !rightColRef.current || wrappers.length < 2) return;

    // First image on top — highest z-index
    wrappers.forEach((w, i) => {
      w.style.zIndex = String(wrappers.length - i);
    });

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      gsap.set(wrappers, { clipPath: "inset(0% 0% 0% 0%)" });

      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: archRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: rightColRef.current,
          scrub: true,
        },
      });

      wrappers.forEach((wrapper, i) => {
        const next = wrappers[i + 1];
        if (!next) return;

        const stepTl = gsap.timeline();
        stepTl
          .to(
            wrapper,
            { clipPath: "inset(0% 0% 100% 0%)", duration: 1.5, ease: "none" },
            0,
          )
          .to(
            sectionRef.current,
            {
              backgroundColor: SECTION_BG[i + 1],
              duration: 1.5,
              ease: "power2.inOut",
            },
            0,
          );

        mainTl.add(stepTl);
      });

      return () => mainTl.kill();
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
      <div className="relative z-10 mx-auto max-w-5xl overflow-hidden px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-20 md:pt-28">
        <div ref={headingRef} className="text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/12 bg-white/60 px-4 py-2 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/70">
            <Sparkles className="h-3.5 w-3.5" />
            {t("badge")}
          </span>
          <h2
            className="mt-2 font-bebas uppercase leading-none tracking-[0.07em] text-elite-black"
            style={{ fontSize: "clamp(2.2rem, 6.5vw, 4.6rem)" }}
          >
            {t("title")}
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm font-cabin text-sm leading-relaxed text-elite-black/50 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* ── Desktop: pinned image mask reveal ── */}
      <div className="relative z-10 hidden md:block">
        <div
          ref={archRef}
          style={{
            display: "flex",
            gap: "clamp(40px, 5vw, 80px)",
            justifyContent: "space-between",
            maxWidth: "1180px",
            marginInline: "auto",
            padding: "0 2.5rem",
          }}
        >
          {/* Left: scrolling text panels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: "320px",
              flexShrink: 0,
            }}
          >
            {STEPS.map((step, i) => (
              <StepText
                key={step.key}
                step={step}
                index={i}
                total={STEPS.length}
                t={t}
              />
            ))}
          </div>

          {/* Right: pinned image stack */}
          <div
            ref={rightColRef}
            style={{
              flexShrink: 1,
              height: "100vh",
              width: "100%",
              maxWidth: "560px",
              position: "relative",
            }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.key}
                ref={(el) => {
                  imgWrapperRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  transform: "translateY(-50%)",
                  height: "440px",
                  width: "100%",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 24px 64px rgba(14,7,9,0.14)",
                }}
              >
                <Image
                  src={step.image}
                  alt={t(`steps.${step.key}.title`)}
                  fill
                  className="object-cover"
                  style={{ objectPosition: step.objPos }}
                  sizes="(min-width: 769px) 560px"
                  priority={i === 0}
                />
                {/* Subtle bottom vignette on image */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 55%, rgba(8,3,5,0.35) 100%)",
                  }}
                  aria-hidden="true"
                />
              </div>
            ))}
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
          <div className="mt-4 flex justify-center gap-2">
            {STEPS.map((s) => (
              <div
                key={s.key}
                className="h-1.5 w-1.5 rounded-full bg-elite-burgundy/25"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
