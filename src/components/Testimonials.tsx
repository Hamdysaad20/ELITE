"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const t = useTranslations("testimonials");

  const items = t.raw("items") as Array<{ quote: string; descriptor: string }>;

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef],
    staggerTargets: [cardRefs.current],
    start: "top 88%",
  });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-36 px-4 sm:px-6 overflow-hidden will-change-transform"
      style={{ background: "#3a0e18" }}
    >
      {/* ── Repeating logo watermark ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/logo_noBG.png')",
          backgroundSize: "120px 120px",
          backgroundRepeat: "repeat",
          filter: "invert(1)",
          opacity: 0.06,
        }}
        aria-hidden="true"
      />

      {/* ── Radial centre-light — lifts content area slightly ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 78% 65% at 50% 50%, rgba(139,38,53,0.30) 0%, rgba(20,5,10,0.0) 60%, rgba(10,2,6,0.55) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Edge fades so waves blend cleanly ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,2,6,0.50) 0%, transparent 14%, transparent 86%, rgba(10,2,6,0.50) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-12 sm:mb-16">
          {/* Badge */}
          <p
            className="font-cabin text-[11px] sm:text-xs font-bold uppercase tracking-[0.26em] mb-3"
            style={{ color: "#f5c87a" }}
          >
            {t("badge")}
          </p>

          {/* Title — cream on dark burgundy = 13 : 1 contrast */}
          <h2
            className="font-calistoga text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] mb-3"
            style={{ color: "#f8f0d2" }}
          >
            {t("titleLine1")}{" "}
            <span style={{ color: "#f5c87a" }}>{t("titleLine2")}</span>
          </h2>

          {/* Subtitle */}
          <p
            className="font-cabin text-sm sm:text-base md:text-lg max-w-md mx-auto leading-relaxed"
            style={{ color: "rgba(248,240,210,0.70)" }}
          >
            {t("subtitle")}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="rounded-3xl p-6 sm:p-7 flex flex-col transition-all duration-300 group hover:-translate-y-1"
              style={{
                background: "rgba(90,22,36,0.70)",
                border: "1px solid rgba(248,240,210,0.12)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.36), inset 0 1px 0 rgba(248,240,210,0.06)",
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Decorative quote mark */}
              <span
                className="font-calistoga text-5xl leading-none select-none -mt-1 mb-1"
                style={{ color: "rgba(245,200,122,0.35)" }}
                aria-hidden="true"
              >
                &ldquo;
              </span>

              {/* Quote text — cream for warm readability on burgundy */}
              <blockquote
                className="font-cabin text-[14px] sm:text-[15px] leading-relaxed flex-1 -mt-3 mb-5"
                style={{ color: "rgba(248,240,210,0.92)" }}
              >
                {item.quote}
              </blockquote>

              {/* Divider */}
              <div
                className="pt-4 border-t"
                style={{ borderColor: "rgba(248,240,210,0.10)" }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(245,200,122,0.18)",
                      border: "1px solid rgba(245,200,122,0.32)",
                    }}
                  >
                    <span
                      className="font-calistoga text-sm"
                      style={{ color: "#f5c87a" }}
                    >
                      {item.descriptor.charAt(0)}
                    </span>
                  </div>
                  {/* Name */}
                  <p
                    className="font-cabin text-xs sm:text-sm font-semibold"
                    style={{ color: "rgba(248,240,210,0.78)" }}
                  >
                    {item.descriptor}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating summary */}
        <div className="text-center mt-10 sm:mt-12">
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
            style={{
              background: "rgba(90,22,36,0.65)",
              border: "1px solid rgba(248,240,210,0.14)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.30)",
            }}
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span
              className="font-cabin text-xs sm:text-sm font-semibold"
              style={{ color: "#f8f0d2" }}
            >
              {t("ratingLabel")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
