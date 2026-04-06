"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkles, Star, Zap, Gift } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLandingReveal } from "@/hooks/useLandingReveal";

/* ── Tier config ── */
const TIERS = [
  {
    key: "bronze" as const,
    img: "/images/levels/B.png",
    color: "#9A6B2E",
    bg: "rgba(154, 107, 46, 0.06)",
    border: "rgba(154, 107, 46, 0.18)",
    ptsKey: "pointsBronze" as const,
    rateKey: "rateBronze" as const,
  },
  {
    key: "silver" as const,
    img: "/images/levels/S.png",
    color: "#4E7A8F",
    bg: "rgba(78, 122, 143, 0.06)",
    border: "rgba(78, 122, 143, 0.18)",
    ptsKey: "pointsSilver" as const,
    rateKey: "rateSilver" as const,
  },
  {
    key: "gold" as const,
    img: "/images/levels/G.png",
    color: "#A8831A",
    bg: "rgba(168, 131, 26, 0.08)",
    border: "rgba(168, 131, 26, 0.25)",
    ptsKey: "pointsGold" as const,
    rateKey: "rateGold" as const,
  },
  {
    key: "platinum" as const,
    img: "/images/levels/P.png",
    color: "#EDD5D8",
    bg: "rgba(16, 5, 9, 0.90)",
    border: "rgba(237, 213, 216, 0.12)",
    ptsKey: "pointsPlatinum" as const,
    rateKey: "ratePlatinum" as const,
    dark: true as const,
  },
] as const;

const BENEFITS = [
  { icon: Star, key: "perk1" as const },
  { icon: Zap, key: "perk2" as const },
  { icon: Gift, key: "perk3" as const },
] as const;

export default function LoyaltyTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const tierRefs = useRef<(HTMLDivElement | null)[]>([]);

  const t = useTranslations("loyaltyTeaser");
  const tLevel = useTranslations("loyalty.levels");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef],
    staggerTargets: [tierRefs.current],
    start: "top 88%",
  });

  return (
    <section
      ref={sectionRef}
      className="bg-elite-cream px-4 pb-12 pt-12 sm:px-6 sm:pb-20 sm:pt-20 md:pb-24 md:pt-24 relative overflow-hidden will-change-transform"
    >
      {/* Decorative blobs */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[12%] end-[6%] h-48 w-48 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute bottom-[15%] start-[4%] h-44 w-44 rounded-full bg-elite-burgundy/[0.04] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ── MOBILE layout (< lg) ── */}
        <div className="block lg:hidden">
          {/* Compact heading */}
          <div ref={headingRef} className="text-center mb-7">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/10 bg-white/80 px-4 py-1.5 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/72">
              <Sparkles className="h-3.5 w-3.5" />
              {t("badge")}
            </span>
            <h2 className="font-calistoga text-elite-black text-2xl leading-tight tracking-[-0.02em]">
              {t("title")}
            </h2>
            <p className="mt-2 font-cabin text-sm leading-relaxed text-elite-black/50">
              {t("subtitle")}
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <LocalizedLink
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-full bg-elite-burgundy px-6 py-3 font-cabin text-sm font-semibold text-elite-cream shadow-md shadow-elite-burgundy/15 active:scale-[0.97]"
            >
              {t("cta")}
            </LocalizedLink>
            <LocalizedLink
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-full border border-elite-burgundy/10 bg-white/60 px-5 py-3 font-cabin text-sm text-elite-black/50"
            >
              {t("signIn")}
            </LocalizedLink>
          </div>
          <p className="text-center font-cabin text-[11px] text-elite-black/30 mb-8">
            {t("freeNote")}
          </p>

          {/* Horizontal scrolling tier chips */}
          <p className="mb-2 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/45 text-center">
            {t("tiersLabel")}
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {[...TIERS].reverse().map((tier, i) => {
              const dark = "dark" in tier;
              return (
                <div
                  key={tier.key}
                  ref={(el) => {
                    tierRefs.current[i] = el;
                  }}
                  className="relative snap-start flex-shrink-0 flex flex-col items-center rounded-2xl border p-3.5 w-[88px]"
                  style={{
                    backgroundColor: tier.bg,
                    borderColor: tier.border,
                    boxShadow: dark
                      ? "0 2px 20px rgba(0,0,0,0.22)"
                      : `0 2px 12px ${tier.color}0a`,
                  }}
                >
                  {/* Top accent */}
                  <div
                    className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
                    style={{
                      background: dark
                        ? "linear-gradient(90deg, transparent, rgba(237,213,216,0.35), transparent)"
                        : `linear-gradient(90deg, transparent, ${tier.color}50, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                  <Image
                    src={tier.img}
                    alt={tLevel(tier.key)}
                    width={48}
                    height={48}
                    className="object-contain mb-2"
                    draggable={false}
                  />
                  <p
                    className="font-calistoga text-sm leading-tight text-center"
                    style={{ color: dark ? "#EDD5D8" : tier.color }}
                  >
                    {tLevel(tier.key)}
                  </p>
                  <p
                    className="font-cabin text-[9px] uppercase tracking-[0.12em] mt-0.5 text-center"
                    style={{
                      color: dark
                        ? "rgba(237,213,216,0.35)"
                        : `${tier.color}60`,
                    }}
                  >
                    {t(`tiers.${tier.key}.tagline`)}
                  </p>
                  <span
                    className="mt-2 font-cabin text-[9px] font-bold px-1.5 py-[2px] rounded-full leading-none whitespace-nowrap"
                    style={{
                      color: dark ? "rgba(237,213,216,0.72)" : tier.color,
                      background: dark
                        ? "rgba(237,213,216,0.07)"
                        : `${tier.color}10`,
                      border: `1px solid ${dark ? "rgba(237,213,216,0.12)" : `${tier.color}20`}`,
                    }}
                  >
                    {t(tier.rateKey)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP layout (lg+) — original two-column ── */}
        <div className="hidden lg:grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:items-start">
          {/* Left: sticky heading */}
          <div ref={headingRef} className="lg:sticky lg:top-24">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/10 bg-white/80 px-4 py-2 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/72">
              <Sparkles className="h-3.5 w-3.5" />
              {t("badge")}
            </span>
            <h2 className="font-calistoga text-elite-black text-2xl leading-tight tracking-[-0.02em] sm:text-3xl md:text-4xl lg:text-[2.9rem]">
              {t("title")}
            </h2>
            <p className="mt-3 max-w-md font-cabin text-sm leading-relaxed text-elite-black/55 sm:text-base">
              {t("subtitle")}
            </p>

            <div className="mt-7 space-y-3.5">
              {BENEFITS.map((b) => (
                <div key={b.key} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-elite-burgundy/[0.07]">
                    <b.icon className="h-3.5 w-3.5 text-elite-burgundy/60" />
                  </div>
                  <span className="font-cabin text-[13px] leading-snug text-elite-black/55 sm:text-sm">
                    {t(b.key)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <LocalizedLink
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-full bg-elite-burgundy px-7 py-3 font-cabin text-sm font-semibold text-elite-cream shadow-md shadow-elite-burgundy/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-elite-burgundy/20 active:scale-[0.97]"
              >
                {t("cta")}
              </LocalizedLink>
              <LocalizedLink
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-full border border-elite-burgundy/10 bg-white/60 px-5 py-3 font-cabin text-sm text-elite-black/50 transition-colors hover:text-elite-burgundy"
              >
                {t("signIn")}
              </LocalizedLink>
            </div>
            <p className="mt-2.5 font-cabin text-[11px] text-elite-black/30">
              {t("freeNote")}
            </p>
          </div>

          {/* Right: tier cards grid */}
          <div>
            <p className="mb-1.5 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/45">
              {t("tiersLabel")}
            </p>
            <p className="mb-5 max-w-sm font-cabin text-sm leading-relaxed text-elite-black/45 sm:mb-6">
              {t("tiersSubtitle")}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {TIERS.map((tier, i) => {
                const dark = "dark" in tier;
                return (
                  <div
                    key={tier.key}
                    ref={(el) => {
                      tierRefs.current[i] = el;
                    }}
                    className="group relative flex flex-col items-center overflow-hidden rounded-[1.4rem] border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[1.6rem] sm:p-6"
                    style={{
                      backgroundColor: tier.bg,
                      borderColor: tier.border,
                      boxShadow: dark
                        ? "0 2px 20px rgba(0,0,0,0.22)"
                        : `0 2px 12px ${tier.color}0a`,
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-[2px]"
                      style={{
                        background: dark
                          ? "linear-gradient(90deg, transparent, rgba(237,213,216,0.35), transparent)"
                          : `linear-gradient(90deg, transparent, ${tier.color}50, transparent)`,
                      }}
                      aria-hidden="true"
                    />
                    <Image
                      src={tier.img}
                      alt={tLevel(tier.key)}
                      width={76}
                      height={76}
                      className="object-contain mb-3 transition-transform duration-300 group-hover:scale-105"
                      draggable={false}
                    />
                    <p
                      className="font-calistoga text-base leading-tight mb-0.5 sm:text-lg"
                      style={{ color: dark ? "#EDD5D8" : tier.color }}
                    >
                      {tLevel(tier.key)}
                    </p>
                    <p
                      className="font-cabin text-[10px] uppercase tracking-[0.14em] mb-2.5"
                      style={{
                        color: dark
                          ? "rgba(237,213,216,0.35)"
                          : `${tier.color}60`,
                      }}
                    >
                      {t(`tiers.${tier.key}.tagline`)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-cabin text-[10px]"
                        style={{
                          color: dark
                            ? "rgba(237,213,216,0.35)"
                            : `${tier.color}55`,
                        }}
                      >
                        {t(tier.ptsKey)}
                      </span>
                      <span
                        className="font-cabin text-[9px] font-bold px-2 py-[3px] rounded-full leading-none whitespace-nowrap"
                        style={{
                          color: dark ? "rgba(237,213,216,0.72)" : tier.color,
                          background: dark
                            ? "rgba(237,213,216,0.07)"
                            : `${tier.color}10`,
                          border: `1px solid ${dark ? "rgba(237,213,216,0.12)" : `${tier.color}20`}`,
                        }}
                      >
                        {t(tier.rateKey)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
