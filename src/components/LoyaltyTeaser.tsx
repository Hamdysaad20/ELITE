"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";

gsap.registerPlugin(ScrollTrigger);

/* ── Tier config ─────────────────────────────────────── */
const TIERS = [
  {
    key: "bronze" as const,
    img: "/images/levels/B.png",
    color: "#9A6B2E",
    bg: "rgba(154, 107, 46, 0.07)",
    border: "rgba(154, 107, 46, 0.22)",
    ptsKey: "pointsBronze" as const,
    rateKey: "rateBronze" as const,
    tierIndex: 0,
    mobileSize: 56,
    desktopSize: 84,
    cardH: 220,
    cardClass: "",
    dark: false,
  },
  {
    key: "silver" as const,
    img: "/images/levels/S.png",
    color: "#4E7A8F",
    bg: "rgba(78, 122, 143, 0.07)",
    border: "rgba(78, 122, 143, 0.22)",
    ptsKey: "pointsSilver" as const,
    rateKey: "rateSilver" as const,
    tierIndex: 1,
    mobileSize: 68,
    desktopSize: 96,
    cardH: 252,
    cardClass: "",
    dark: false,
  },
  {
    key: "gold" as const,
    img: "/images/levels/G.png",
    color: "#A8831A",
    bg: "rgba(168, 131, 26, 0.10)",
    border: "rgba(168, 131, 26, 0.32)",
    ptsKey: "pointsGold" as const,
    rateKey: "rateGold" as const,
    tierIndex: 2,
    mobileSize: 80,
    desktopSize: 108,
    cardH: 280,
    cardClass: "loyalty-gold-glow",
    dark: false,
  },
  {
    key: "platinum" as const,
    img: "/images/levels/P.png",
    color: "#EDD5D8",
    bg: "rgba(16, 5, 9, 0.92)",
    border: "rgba(237, 213, 216, 0.14)",
    ptsKey: "pointsPlatinum" as const,
    rateKey: "ratePlatinum" as const,
    tierIndex: 3,
    mobileSize: 96,
    desktopSize: 120,
    cardH: 308,
    cardClass: "loyalty-platinum-shimmer",
    dark: true,
  },
] as const;

const PERKS = ["perk1", "perk2", "perk3"] as const;

/* ── Particle colours (dark enough to read on cream) ── */
const P_COLORS = [
  "#8B2635", // burgundy
  "#7A4B10", // dark bronze
  "#6B5A0A", // dark gold
  "#2A5A70", // dark teal
  "#5A1A25", // deep red
  "#4A3208", // deep amber
  "#8B4513", // saddle brown
  "#3D2B6B", // deep violet accent
];

interface ParticleData {
  angle: number;
  maxDist: number;
  depth: number; // 0 = far/slow, 1 = close/fast
  color: string;
  maxAlpha: number;
  baseSize: number;
}

/* ── Component ──────────────────────────────────────── */
export default function LoyaltyTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const perksRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("loyaltyTeaser");
  const tLevel = useTranslations("loyalty.levels");

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isDesktop = window.innerWidth >= 1024;

    const ctx = gsap.context(() => {
      /* ── Reduced motion: show everything instantly ── */
      if (prefersReduced) {
        gsap.set(
          [
            headRef.current,
            perksRef.current,
            ctaRef.current,
            ...cardRefs.current,
            mobileRef.current,
          ],
          { opacity: 1, clearProps: "all" },
        );
        return;
      }

      /* ════════════════════════════════════════
         MOBILE — simple fade-up
         ════════════════════════════════════════ */
      if (!isDesktop) {
        const targets = [
          headRef.current,
          mobileRef.current,
          ctaRef.current,
        ].filter(Boolean);
        gsap.set(targets, { opacity: 0, y: 22 });
        ScrollTrigger.create({
          trigger: section,
          start: "top 86%",
          once: true,
          onEnter: () => {
            gsap.to(targets, {
              opacity: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.1,
              ease: "power3.out",
              clearProps: "all",
            });
          },
        });
        return;
      }

      /* ════════════════════════════════════════
         DESKTOP — Canvas warp-burst + GSAP
         ════════════════════════════════════════ */
      const c = canvas.getContext("2d")!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0,
        H = 0,
        CX = 0,
        CY = 0;

      const setupCanvas = () => {
        W = section.offsetWidth;
        H = section.offsetHeight;
        CX = W / 2;
        CY = H / 2;
        // Setting width/height resets the canvas transform — always re-apply scale after
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        c.scale(dpr, dpr);
      };
      setupCanvas();
      window.addEventListener("resize", setupCanvas);

      /* ── Build particle array ── */
      const COUNT = 820;
      const TRAIL_DT = 0.11; // long enough trail to see clearly
      let particles: ParticleData[] = [];

      const buildParticles = () => {
        const spread = Math.sqrt(W * W + H * H) * 0.56;
        particles = Array.from({ length: COUNT }, (_, i) => {
          const depth = Math.random();
          return {
            angle: (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
            maxDist: (0.3 + Math.random() * 0.7) * spread,
            depth,
            color: P_COLORS[Math.floor(Math.random() * P_COLORS.length)],
            maxAlpha: 0.72 + depth * 0.28, // 0.72–1.0
            baseSize: 1.2 + depth * 3.8, // 1.2–5.0 px
          };
        });
      };
      buildParticles();

      /* ── Position formula (pure function of t) ── */
      const getState = (p: ParticleData, t: number) => {
        const speedMult = 0.45 + p.depth * 0.85;
        const clamped = Math.min(1, t * speedMult);
        const e = 1 - Math.pow(1 - clamped, 3); // power3.out position
        // Alpha stays near max through first 60% of travel, then fades
        const alpha = p.maxAlpha * (1 - Math.pow(clamped, 1.6));
        return {
          x: CX + Math.cos(p.angle) * p.maxDist * e,
          y: CY + Math.sin(p.angle) * p.maxDist * e,
          alpha: Math.max(0, alpha),
        };
      };

      /* ── Animation state proxy ── */
      const state = { t: 0, flash: 0 };
      let animating = false;
      let rafId = -1;

      /* ── Render loop ── */
      const CREAM = "#FDF5E6";
      const renderFrame = () => {
        // Fill with section bg colour so multiply blending has a real surface
        c.fillStyle = CREAM;
        c.fillRect(0, 0, W, H);

        /* Particles — multiply = ink-stroke on cream */
        c.save();
        c.globalCompositeOperation = "multiply";

        for (const p of particles) {
          const curr = getState(p, state.t);
          const prev = getState(p, Math.max(0, state.t - TRAIL_DT));

          if (curr.alpha < 0.015) continue;

          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;

          /* Streak trail */
          if (dx * dx + dy * dy > 0.4) {
            const hexA = Math.floor(curr.alpha * 255)
              .toString(16)
              .padStart(2, "0");
            const grad = c.createLinearGradient(prev.x, prev.y, curr.x, curr.y);
            grad.addColorStop(0, `${CREAM}00`);
            grad.addColorStop(1, `${p.color}${hexA}`);
            c.strokeStyle = grad;
            c.lineWidth = p.baseSize * 2.4;
            c.lineCap = "round";
            c.beginPath();
            c.moveTo(prev.x, prev.y);
            c.lineTo(curr.x, curr.y);
            c.stroke();
          }

          /* Head dot */
          c.globalAlpha = curr.alpha;
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(curr.x, curr.y, p.baseSize * 1.4, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
        }

        c.restore();

        /* Central flash — bright cream burst, source-over */
        if (state.flash > 0.01) {
          const r = Math.min(W, H) * 0.6;
          const grd = c.createRadialGradient(CX, CY, 0, CX, CY, r);
          grd.addColorStop(0, `rgba(255,252,242,${state.flash.toFixed(3)})`);
          grd.addColorStop(
            0.25,
            `rgba(255,252,242,${(state.flash * 0.5).toFixed(3)})`,
          );
          grd.addColorStop(1, "transparent");
          c.fillStyle = grd;
          c.fillRect(0, 0, W, H);
        }

        rafId = requestAnimationFrame(renderFrame);
      };

      /* ── Initial hidden state for content ── */
      const cards = cardRefs.current.filter(Boolean);
      gsap.set(headRef.current, { opacity: 0, y: -20 });
      gsap.set(perksRef.current, { opacity: 0, y: 10 });
      gsap.set(cards, {
        opacity: 0,
        scale: 0.7,
        y: 30,
        transformOrigin: "center bottom",
      });
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });

      /* ── ScrollTrigger ── */
      ScrollTrigger.create({
        trigger: section,
        start: "top 76%",
        once: true,
        onEnter: () => {
          animating = true;
          rafId = requestAnimationFrame(renderFrame);

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          /* 1 ── Particle burst — power2 so particles stay bright longer */
          tl.to(state, { t: 1, duration: 2.0, ease: "power2.out" }, 0);

          /* 2 ── Flash at center — peaks at 0.20s, fully gone by 0.65s */
          tl.to(
            state,
            { flash: 0.95, duration: 0.18, ease: "power1.in" },
            0.08,
          );
          tl.to(state, { flash: 0, duration: 0.6, ease: "power2.out" }, 0.26);

          /* — content starts emerging AFTER flash peak — */

          /* 3 ── Heading rises from the light */
          tl.to(
            headRef.current,
            { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" },
            0.42,
          );

          /* 4 ── Cards materialise, staggered, from depth */
          tl.to(
            cards,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.72,
              stagger: 0.1,
              ease: "back.out(1.2)",
            },
            0.52,
          );

          /* 5 ── Perks strip slides in */
          tl.to(
            perksRef.current,
            { opacity: 1, y: 0, duration: 0.48, ease: "power3.out" },
            0.6,
          );

          /* 6 ── CTA last */
          tl.to(
            ctaRef.current,
            { opacity: 1, y: 0, duration: 0.48, ease: "power3.out" },
            0.98,
          );

          /* 7 ── Stop canvas, clear residual pixels */
          tl.add(() => {
            animating = false;
            cancelAnimationFrame(rafId);
            c.clearRect(0, 0, W, H);
            gsap.set(
              [headRef.current, perksRef.current, ctaRef.current, ...cards],
              {
                clearProps: "filter,willChange",
              },
            );
          }, 2.2);
        },
      });

      return () => {
        window.removeEventListener("resize", setupCanvas);
        cancelAnimationFrame(rafId);
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-elite-cream px-4 py-10 sm:py-14 overflow-hidden text-center relative"
    >
      {/* ── Particle canvas (desktop only) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 hidden lg:block"
        aria-hidden
      />

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto lg:max-w-5xl relative z-10">
        {/* Heading */}
        <div ref={headRef} className="mb-8 sm:mb-10">
          <p className="font-cabin text-[11px] font-bold uppercase tracking-[0.26em] text-elite-burgundy/45 mb-3">
            {t("badge")}
          </p>
          <h2 className="font-calistoga text-elite-black text-[1.9rem] sm:text-[2.6rem] lg:text-[3rem] leading-[1.1] tracking-[-0.02em] mb-2">
            {t("title")}
          </h2>
          <p className="font-cabin text-elite-black/45 text-sm sm:text-[15px]">
            {t("subtitle")}
          </p>
        </div>

        {/* Desktop perks strip */}
        <div
          ref={perksRef}
          className="hidden lg:flex items-center justify-center gap-2 mb-10"
        >
          {PERKS.map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              {i > 0 && (
                <span
                  className="w-px h-3.5 bg-elite-black/15 mx-2"
                  aria-hidden
                />
              )}
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--elite-burgundy)" }}
                aria-hidden
              />
              <span className="font-cabin text-[13px] text-elite-black/55">
                {t(key)}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile: ascending badge row */}
        <div
          ref={mobileRef}
          className="lg:hidden flex items-end justify-center gap-2 mb-8"
        >
          {TIERS.map(({ key, img, color, ptsKey, mobileSize }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 flex-1 min-w-0"
            >
              <div
                className={
                  key === "gold" ? "loyalty-gold-glow rounded-full" : ""
                }
              >
                <Image
                  src={img}
                  alt={tLevel(key)}
                  width={mobileSize}
                  height={mobileSize}
                  className="object-contain"
                  draggable={false}
                />
              </div>
              <p
                className="font-cabin font-bold text-[11px] sm:text-[13px] leading-none"
                style={{ color }}
              >
                {tLevel(key)}
              </p>
              <p className="font-cabin text-[10px] sm:text-[11px] text-elite-black/35">
                {t(ptsKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: staircase tier cards */}
        <div className="hidden lg:flex items-end gap-4 mb-10">
          {TIERS.map(
            (
              {
                key,
                img,
                color,
                bg,
                border,
                ptsKey,
                rateKey,
                tierIndex,
                desktopSize,
                cardH,
                cardClass,
                dark,
              },
              i,
            ) => (
              <div
                key={key}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={[
                  "relative flex flex-col flex-1 rounded-2xl border overflow-hidden",
                  "transition-transform duration-300 hover:-translate-y-2 group",
                  cardClass,
                ].join(" ")}
                style={{
                  height: `${cardH}px`,
                  backgroundColor: bg,
                  borderColor: border,
                  boxShadow: dark
                    ? "0 2px 24px rgba(0,0,0,0.28)"
                    : `0 2px 16px ${color}12`,
                }}
              >
                {/* ── Top accent stripe ── */}
                <div
                  className="h-[3px] w-full shrink-0"
                  style={{
                    background: dark
                      ? `linear-gradient(90deg, transparent 0%, rgba(237,213,216,0.45) 50%, transparent 100%)`
                      : `linear-gradient(90deg, transparent 0%, ${color}70 50%, transparent 100%)`,
                  }}
                />

                {/* ── Badge image ── */}
                <div className="flex-1 flex items-center justify-center">
                  <Image
                    src={img}
                    alt={tLevel(key)}
                    width={desktopSize}
                    height={desktopSize}
                    className="object-contain transition-transform duration-300 group-hover:scale-108"
                    draggable={false}
                  />
                </div>

                {/* ── Text + meta pinned to bottom ── */}
                <div className="px-4 pb-4 text-start">
                  {/* Tagline */}
                  <p
                    className="font-cabin text-[9px] font-bold uppercase tracking-[0.20em] mb-1"
                    style={{
                      color: dark ? "rgba(237,213,216,0.38)" : `${color}75`,
                    }}
                  >
                    {t(`tiers.${key}.tagline`)}
                  </p>

                  {/* Tier name */}
                  <p
                    className="font-calistoga text-[1.25rem] leading-tight mb-2"
                    style={{ color: dark ? "#EDD5D8" : color }}
                  >
                    {tLevel(key)}
                  </p>

                  {/* Points + earn-rate row */}
                  <div className="flex items-center justify-between mb-2.5">
                    <p
                      className="font-cabin text-[11px]"
                      style={{
                        color: dark ? "rgba(237,213,216,0.32)" : `${color}60`,
                      }}
                    >
                      {t(ptsKey)}
                    </p>
                    <span
                      className="font-cabin text-[9px] font-bold px-1.5 py-[3px] rounded-full leading-none whitespace-nowrap"
                      style={{
                        color: dark ? "rgba(237,213,216,0.80)" : color,
                        background: dark
                          ? "rgba(237,213,216,0.08)"
                          : `${color}14`,
                        border: `1px solid ${dark ? "rgba(237,213,216,0.14)" : `${color}28`}`,
                      }}
                    >
                      {t(rateKey)}
                    </span>
                  </div>

                  {/* 4-segment tier progress bar */}
                  <div className="flex gap-1">
                    {([0, 1, 2, 3] as const).map((seg) => (
                      <div
                        key={seg}
                        className="h-[3px] flex-1 rounded-full"
                        style={{
                          backgroundColor:
                            seg <= tierIndex
                              ? dark
                                ? "rgba(237,213,216,0.55)"
                                : color
                              : dark
                                ? "rgba(237,213,216,0.10)"
                                : `${color}18`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="text-center">
          <LocalizedLink
            href="/auth/signin"
            className="btn-shimmer inline-flex items-center justify-center rounded-full px-10 py-4 font-cabin text-base font-bold text-elite-cream shadow-lg shadow-elite-burgundy/20 transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-elite-burgundy/30 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #8B2635 0%, #A03040 100%)",
            }}
          >
            {t("cta")}
          </LocalizedLink>
          <p className="mt-3 font-cabin text-[11px] text-elite-black/32">
            {t("freeNote")}
          </p>
        </div>
      </div>
    </section>
  );
}
