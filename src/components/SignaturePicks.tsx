"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Sparkles } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLandingReveal } from "@/hooks/useLandingReveal";

const PICKS = [
  {
    key: "signatureMilkshake" as const,
    image: "/images/HQ16by9/MICROTalentCenteredMILKSHAKE.jpg",
    objectPosition: "center 35%",
  },
  {
    key: "taroBoba" as const,
    image: "/images/MicroTARO.png",
    objectPosition: "center 48%",
  },
  {
    key: "spanishBoba" as const,
    image: "/images/menaCloseup.png",
    objectPosition: "center 58%",
  },
  {
    key: "goldenBoba" as const,
    image: "/images/HQ16by9/ModelHolding.jpg",
    objectPosition: "center 42%",
  },
] as const;

export default function SignaturePicks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const t = useTranslations("signaturePicks");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef],
    staggerTargets: [cardRefs.current],
    start: "top 88%",
  });

  const featuredPick = PICKS[0];
  const supportingPicks = PICKS.slice(1);

  return (
    <section
      ref={sectionRef}
      className="bg-white px-4 py-14 sm:px-6 sm:py-20 md:py-24 relative overflow-hidden"
    >
      {/* Ambient light blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[8%] right-[2%] h-72 w-72 rounded-full bg-elite-burgundy/[0.032] blur-3xl" />
        <div className="absolute bottom-[10%] left-[4%] h-60 w-60 rounded-full bg-[#c7985f]/[0.07] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ── Heading row ── */}
        <div
          ref={headingRef}
          className="mb-10 flex flex-col gap-5 sm:mb-12 lg:mb-14 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/12 bg-elite-cream px-4 py-2 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/70">
              <Sparkles className="h-3.5 w-3.5" />
              {t("badge")}
            </span>
            <h2 className="font-calistoga text-elite-black text-[1.7rem] leading-tight tracking-[-0.02em] sm:text-[2.1rem] md:text-[2.6rem] lg:text-[3rem]">
              {t("title")}
            </h2>
            <p className="mt-3 max-w-lg font-cabin text-sm leading-relaxed text-elite-black/55 sm:text-[0.93rem]">
              {t("subtitle")}
            </p>
          </div>

          <LocalizedLink
            href="/menu"
            className="inline-flex items-center gap-2 self-start lg:self-end rounded-full bg-elite-burgundy px-6 py-3 font-cabin text-sm font-semibold text-elite-cream shadow-[0_4px_20px_rgba(139,38,53,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(139,38,53,0.32)] active:scale-95"
          >
            {t("cta")}
            <ArrowUpRight className="h-4 w-4" />
          </LocalizedLink>
        </div>

        {/* ── Cards — responsive grid ── */}
        {/*
          Mobile  (<640px): single column, stacked
          Tablet  (640-1023px): featured full-width, supporting 3-col row
          Desktop (≥1024px): 2-col split, right column 3 equal rows matching featured height
        */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:gap-5 lg:items-start">
          {/* ── Featured card ── */}
          <LocalizedLink href="/menu" className="group block">
            <article
              ref={(el) => {
                cardRefs.current[0] = el;
              }}
              className="
                relative overflow-hidden rounded-[1.75rem]
                border border-white/[0.06] shadow-[0_20px_56px_rgba(14,7,9,0.12)]
                transition-all duration-500 ease-out
                group-hover:shadow-[0_28px_72px_rgba(14,7,9,0.2)] group-hover:-translate-y-1
                h-[22rem] sm:h-[26rem] lg:h-[32rem]
              "
            >
              {/* Photo */}
              <Image
                src={featuredPick.image}
                alt={t(`items.${featuredPick.key}.name`)}
                fill
                priority={false}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                style={{ objectPosition: featuredPick.objectPosition }}
              />

              {/* Gradient — clear top, dark bottom */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(8,3,5,0.32) 0%, rgba(8,3,5,0.08) 35%, rgba(8,3,5,0.60) 65%, rgba(8,3,5,0.94) 100%)",
                }}
                aria-hidden="true"
              />

              {/* Featured badge — top-left */}
              <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
                <p className="inline-flex rounded-full border border-white/28 bg-black/42 px-3 py-1.5 font-cabin text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                  {t("featuredLabel")}
                </p>
              </div>

              {/* Arrow button — top-right */}
              <div
                className="absolute top-5 right-5 sm:top-6 sm:right-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/28 bg-black/40 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/22 group-hover:scale-110"
                aria-hidden="true"
              >
                <ArrowUpRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px" />
              </div>

              {/* Bottom text block */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
                <p className="mb-2 font-cabin text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#f5c87a]">
                  {t(`items.${featuredPick.key}.tag`)}
                </p>
                <h3 className="font-calistoga text-white leading-[1.08] text-[1.6rem] sm:text-[2rem] lg:text-[2.5rem]">
                  {t(`items.${featuredPick.key}.name`)}
                </h3>
                <p className="mt-3 font-cabin text-[0.82rem] sm:text-sm leading-relaxed text-white/85 max-w-sm lg:max-w-md">
                  {t(`items.${featuredPick.key}.description`)}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/18 pt-4">
                  <p className="font-cabin text-[11px] text-white/60 leading-snug max-w-[16rem] hidden sm:block">
                    {t("featuredNote")}
                  </p>
                  <span className="inline-flex items-center gap-1.5 font-cabin text-[0.82rem] font-semibold text-white transition-all duration-200 group-hover:text-white">
                    {t("viewDrink")}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </article>
          </LocalizedLink>

          {/* ── Supporting picks — right column ── */}
          {/*
            Mobile  : 1-col stacked, each 13rem
            Tablet  : 3-col horizontal row, each 14rem
            Desktop : 1-col stacked, each 10rem — 3×10 + 2×1(gap) = 32rem matches featured min-h
          */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1 lg:gap-4">
            {supportingPicks.map((pick, index) => (
              <LocalizedLink
                key={pick.key}
                href="/menu"
                className="group block"
              >
                <article
                  ref={(el) => {
                    cardRefs.current[index + 1] = el;
                  }}
                  className="
                    relative overflow-hidden rounded-[1.5rem]
                    border border-white/[0.05] shadow-sm
                    transition-all duration-500 ease-out
                    group-hover:shadow-[0_12px_40px_rgba(14,7,9,0.18)] group-hover:-translate-y-0.5
                    h-[13rem] sm:h-[14rem] lg:h-[10rem]
                  "
                >
                  {/* Photo */}
                  <Image
                    src={pick.image}
                    alt={t(`items.${pick.key}.name`)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 30vw"
                    className="object-cover transition-transform duration-600 ease-out group-hover:scale-[1.06]"
                    style={{ objectPosition: pick.objectPosition }}
                  />

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(8,3,5,0.24) 0%, rgba(8,3,5,0.44) 55%, rgba(8,3,5,0.90) 100%)",
                    }}
                    aria-hidden="true"
                  />

                  {/* Arrow — top-right */}
                  <div
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/28 bg-black/40 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/22 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 text-white transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px" />
                  </div>

                  {/* Text — bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="font-cabin text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#f5c87a] mb-1.5">
                      {t(`items.${pick.key}.tag`)}
                    </p>
                    <h3 className="font-calistoga text-white leading-snug text-[1.15rem] sm:text-[1.05rem] lg:text-[1.1rem]">
                      {t(`items.${pick.key}.name`)}
                    </h3>
                    {/* Description — only visible when cards are taller (mobile stack / tablet) */}
                    <p className="mt-1.5 font-cabin text-[0.75rem] leading-relaxed text-white/80 line-clamp-2 sm:hidden lg:hidden">
                      {t(`items.${pick.key}.description`)}
                    </p>
                  </div>
                </article>
              </LocalizedLink>
            ))}
          </div>
        </div>

        {/* ── Mobile CTA — below cards ── */}
        <div className="mt-5 flex justify-center sm:hidden">
          <LocalizedLink
            href="/menu"
            className="inline-flex items-center gap-2 rounded-full bg-elite-burgundy px-7 py-3 font-cabin text-sm font-semibold text-elite-cream shadow-[0_4px_18px_rgba(139,38,53,0.22)] active:scale-95"
          >
            {t("cta")}
            <ArrowUpRight className="h-4 w-4" />
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
