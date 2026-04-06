"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { Sparkles } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";

gsap.registerPlugin(ScrollTrigger);

export default function JoinCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("joinCta");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [cardRef],
    start: "top 84%",
  });

  useEffect(() => {
    const section = sectionRef.current;
    const sparkle = sparkleRef.current;
    const ctaBtn = ctaBtnRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      return;
    }

    let started = false;
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 84%",
      toggleActions: "play none none none",
      onEnter: () => {
        if (started) return;
        started = true;

        if (sparkle) {
          gsap.to(sparkle, {
            rotation: 360,
            duration: 8,
            repeat: -1,
            ease: "none",
          });
        }
        if (ctaBtn) {
          gsap.to(ctaBtn, {
            scale: 1.03,
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      },
    });

    return () => {
      trigger.kill();
      if (sparkle) {
        gsap.killTweensOf(sparkle);
        gsap.set(sparkle, { rotation: 0 });
      }
      if (ctaBtn) {
        gsap.killTweensOf(ctaBtn);
        gsap.set(ctaBtn, { scale: 1 });
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-elite-cream py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative will-change-transform"
    >
      {/* Decorative floating shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-20 h-20 rounded-full bg-elite-burgundy/[0.04] blur-xl animate-drift" />
        <div className="absolute bottom-[15%] right-[8%] w-24 h-24 rounded-full bg-elite-burgundy/[0.03] blur-2xl animate-drift-reverse" />
        <div className="absolute top-[50%] left-[70%] w-2 h-2 rounded-full bg-elite-burgundy/10 animate-float" />
        <div className="absolute top-[30%] right-[30%] w-1.5 h-1.5 rounded-full bg-elite-burgundy/8 animate-float-reverse" />
      </div>

      <div
        ref={cardRef}
        className="max-w-xl mx-auto bg-white rounded-[2rem] shadow-xl border border-elite-burgundy/8 p-8 sm:p-10 md:p-12 text-center relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-elite-burgundy/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-elite-burgundy/[0.04] to-transparent rounded-full blur-xl pointer-events-none" />

        <div
          ref={sparkleRef}
          className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-elite-burgundy/8 mb-5 sm:mb-6 relative z-10"
        >
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-elite-burgundy" />
        </div>

        <h2 className="font-calistoga text-elite-burgundy text-xl sm:text-2xl md:text-3xl leading-tight mb-3 sm:mb-4 relative z-10">
          {t("title")}
        </h2>
        <p className="font-cabin text-elite-black/55 text-sm sm:text-[15px] md:text-base leading-relaxed mb-7 sm:mb-8 max-w-md mx-auto relative z-10">
          {t("subtitle")}
        </p>
        <div ref={ctaBtnRef} className="inline-block relative z-10">
          <LocalizedLink
            href="/auth/signin"
            className="btn-shimmer inline-flex items-center justify-center bg-elite-burgundy text-elite-cream px-10 py-3.5 sm:py-4 rounded-full font-cabin font-bold text-sm sm:text-base shadow-lg shadow-elite-burgundy/20 hover:shadow-xl hover:shadow-elite-burgundy/30 hover:scale-105 active:scale-95 transition-all duration-300 touch-manipulation"
          >
            {t("cta")}
          </LocalizedLink>
        </div>
        <p className="font-cabin text-elite-black/40 text-xs sm:text-sm mt-5 relative z-10">
          {t("signInPrompt")}{" "}
          <LocalizedLink
            href="/auth/signin"
            className="text-elite-burgundy font-semibold hover:underline"
          >
            {t("signInLink")}
          </LocalizedLink>
        </p>
      </div>
    </section>
  );
}
