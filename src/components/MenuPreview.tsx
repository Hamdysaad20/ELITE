"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { ChevronRight, Sparkles } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";

/*
  6drinksSectionsNoBoarders.png — 3-column × 2-row grid image (2752×1536 px, ~16:9).
  No white card borders or gaps — clean bleed-to-bleed crops.

  background-size: auto 220%
  ──────────────────────────────────────────────────────────────────────
  • Y axis: 220% → bgH = 2.2×containerH. Each row occupies 1.1×containerH.
    Drink cup centers sit at bgH/4 (row 1) and 3×bgH/4 (row 2).

    To push the visible drink up ~20% in the card (cup at ~30% from top,
    clear of the bottom label gradient):
      container_y = bgY_cup + Y% × (cH - bgH)
      Row 1: 0.55cH + Y% × (−1.2cH) = 0.30cH  →  Y ≈ 21%
      Row 2: 1.65cH + Y% × (−1.2cH) = 0.30cH  →  Y ≈ 112% (CSS clamps → 100%)
              at Y=100%: row 2 cup lands at 0.45cH (45% from top — still upper half)

  • X axis: auto (aspect-ratio-preserving, bgW ≈ 3.94×cW for ~1:1 cards).
    Column centers: col1 at bgW/6, col2 at bgW/2, col3 at 5×bgW/6.
    X = (0.5cW − colCenter) / (cW − bgW):  col1 ≈ 8%,  col2 = 50%,  col3 ≈ 92%
    (Cards range 156–188px wide → X varies ±2%, values balance across breakpoints)

  Grid layout:
  ┌─────────────┬─────────────┬─────────────┐
  │ Iced Matcha │  Hot Coffee │ Choc Frappe │  row 1 → Y 21%
  ├─────────────┼─────────────┼─────────────┤
  │    Boba     │ Mocha Frappe│   Unicorn   │  row 2 → Y 100%
  └─────────────┴─────────────┴─────────────┘
       X 8%          X 50%        X 92%
*/
const GRID_SRC = "/images/Hero Items/6drinksSectionsNoBoarders.png";

const CATEGORIES = [
  {
    key: "hotDrinks" as const,
    bgPos: "50% 21%", // row 1, col 2 — hot dark coffee
    href: "/menu",
  },
  {
    key: "icedDrinks" as const,
    bgPos: "10% 21%", // row 1, col 1 — iced matcha
    href: "/menu",
  },
  {
    key: "smoothies" as const,
    bgPos: "50% 100%", // Y=100% with 110% zoom → slightly zoomed out for a wider view
    bgSize: "auto 110%", // zoomed out — shows more of the smoothie image
    src: "/images/Hero Items/smoothy.png",
    href: "/menu",
  },
  {
    key: "milkshakes" as const,
    bgPos: "50% 100%", // row 2, col 2 — mocha kit-kat frappe
    href: "/menu",
  },
  {
    key: "boba" as const,
    bgPos: "10% 100%", // row 2, col 1 — boba / bubble tea
    href: "/menu",
  },
  {
    key: "kidsCorner" as const,
    bgPos: "90% 100%", // row 2, col 3 — unicorn rainbow
    href: "/menu",
  },
] as const;

export default function MenuPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("menuPreview");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef],
    staggerTargets: [cardRefs.current],
    start: "top 88%",
  });

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean);
    const grid = gridRef.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!grid || cards.length === 0 || reduced) return;
    if (!window.matchMedia("(min-width: 640px)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      cards.forEach((card) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const deltaX = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const deltaY = (e.clientY - rect.top - rect.height / 2) / rect.height;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        gsap.to(card, {
          rotateY: distance < 1.5 ? deltaX * 8 : 0,
          rotateX: distance < 1.5 ? -deltaY * 8 : 0,
          scale: distance < 1.5 ? 1.03 : 1,
          duration: distance < 1.5 ? 0.4 : 0.6,
          ease: "power2.out",
        });
      });
    };

    const handleMouseLeave = () => {
      cards.forEach((card) => {
        if (!card) return;
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
        });
      });
    };

    grid.addEventListener("mousemove", handleMouseMove);
    grid.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      grid.removeEventListener("mousemove", handleMouseMove);
      grid.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-elite-cream px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-20 md:pb-24 md:pt-24 relative z-10 overflow-hidden will-change-transform"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[4%] h-44 w-44 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute bottom-[12%] right-[6%] h-48 w-48 rounded-full bg-elite-burgundy/[0.05] blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:items-start">
          {/* ── Sticky heading column ── */}
          <div ref={headingRef} className="lg:sticky lg:top-24">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/10 bg-white/80 px-4 py-2 font-cabin text-[11px] font-bold uppercase tracking-[0.22em] text-elite-burgundy/72">
              <Sparkles className="h-3.5 w-3.5" />
              {t("badge")}
            </span>
            <h2 className="font-calistoga text-elite-black text-2xl leading-tight tracking-[-0.02em] sm:text-3xl md:text-4xl lg:text-[2.9rem]">
              {t("title")}
            </h2>
            <p className="mt-3 max-w-md font-cabin text-sm leading-relaxed text-elite-black/58 sm:text-base md:text-lg">
              {t("subtitle")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-elite-burgundy/10 bg-white px-4 py-2 font-cabin text-sm font-semibold text-elite-black/58 shadow-sm">
                {t("quickNote")}
              </div>
              <LocalizedLink
                href="/menu"
                className="inline-flex items-center gap-1.5 rounded-full bg-elite-burgundy px-5 py-3 font-cabin text-sm font-semibold text-elite-cream shadow-md shadow-elite-burgundy/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-elite-burgundy/20 group"
              >
                {t("viewFullMenu")}
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </LocalizedLink>
            </div>
          </div>

          {/* ── Category card grid ── */}
          <div
            ref={gridRef}
            className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 md:gap-6"
            style={{ perspective: "800px" }}
          >
            {CATEGORIES.map((cat, i) => (
              <LocalizedLink key={cat.key} href={cat.href} className="block">
                <div
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="glow-card group relative flex h-full min-h-[11.5rem] cursor-pointer flex-col justify-end overflow-hidden rounded-[1.6rem] border border-elite-burgundy/8 bg-elite-cream shadow-sm transition-all duration-300 hover:border-elite-burgundy/15 hover:shadow-xl sm:min-h-[13rem] sm:rounded-[1.9rem]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* ── Cropped cell from grid image (or standalone override) ── */}
                  <div
                    className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    style={{
                      backgroundImage: `url('${(cat as { src?: string }).src ?? GRID_SRC}')`,
                      backgroundSize:
                        (cat as { bgSize?: string }).bgSize ?? "auto 220%",
                      backgroundPosition: cat.bgPos,
                      backgroundRepeat: "no-repeat",
                    }}
                  />

                  {/* Bottom cream fade — blends image into card */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                    style={{
                      background:
                        "linear-gradient(to top, #FDF5E6 0%, #FDF5E6 25%, rgba(253,245,230,0.88) 55%, rgba(253,245,230,0.3) 80%, transparent 100%)",
                    }}
                  />
                  {/* Left edge soften */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-elite-cream/25 to-transparent" />

                  {/* Arrow — top right */}
                  <div className="absolute top-3 right-3 z-10">
                    <ChevronRight className="h-4 w-4 text-elite-burgundy/45 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-elite-burgundy rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </div>

                  {/* Category label — bottom left */}
                  <div className="relative z-10 p-4 sm:p-5">
                    <span className="font-cabin text-sm font-semibold leading-snug text-elite-black sm:text-[15px]">
                      {t(`categories.${cat.key}`)}
                    </span>
                  </div>
                </div>
              </LocalizedLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
