"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Instagram } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";
import DomeGallery from "@/components/DomeGallery";

const INSTAGRAM_URL = "https://www.instagram.com/officieleliteeg";

const GALLERY_IMAGES = [
  {
    src: "/images/ourplace/fc58696a-aab2-4167-b896-d955f68c8da4.JPG",
    alt: "Elite café counter with illuminated logo",
  },
  {
    src: "/images/ourplace/wide.JPG",
    alt: "Elite café full seating area at night",
  },
  {
    src: "/images/ourplace/wideSideview.JPG",
    alt: "Elite café barista counter and menu boards",
  },
  {
    src: "/images/ourplace/wide2.JPG",
    alt: "Elite café busy evening atmosphere",
  },
  {
    src: "/images/ourplace/d90ac0fe-cec2-42f0-a7c8-4a9586562a2f.JPG",
    alt: "Elite café seating area with panoramic windows",
  },
  {
    src: "/images/ourplace/drinksList.png",
    alt: "Elite signature drinks lineup",
  },
];

export function InstagramGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("instagramGallery");
  const prefersReduced = useReducedMotion();

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef, ctaRef],
    start: "top 85%",
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-elite-cream"
    >
      {/* ── Heading ── */}
      <div
        ref={headingRef}
        className="relative z-10 pt-16 pb-4 px-4 text-center sm:pt-24 sm:pb-6"
      >
        {/* Instagram handle badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-elite-burgundy/12 bg-white/60 px-4 py-1.5 backdrop-blur-sm">
          <Instagram className="h-3.5 w-3.5 text-elite-burgundy" />
          <span className="font-cabin text-[11px] font-semibold uppercase tracking-[0.22em] text-elite-burgundy/70">
            @officieleliteeg
          </span>
        </div>

        <h2 className="font-calistoga text-elite-black text-3xl leading-tight tracking-[-0.02em] sm:text-4xl md:text-[2.8rem] lg:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-md font-cabin text-sm leading-relaxed text-elite-black/50 sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      {/* ── Dome Gallery ──
          overlayBlurColor matches the elite-cream background (#f8f0d2)
          so the vignette blends into the section seamlessly.
      ── */}
      <div
        className="relative w-full"
        style={{ height: "clamp(380px, 55vw, 680px)" }}
      >
        <DomeGallery
          images={GALLERY_IMAGES}
          fit={0.8}
          minRadius={600}
          maxVerticalRotationDeg={0}
          segments={34}
          dragDampening={2}
          grayscale={false}
          overlayBlurColor="#f8f0d2"
          imageBorderRadius="20px"
          openedImageBorderRadius="24px"
          openedImageWidth="420px"
          openedImageHeight="420px"
        />
      </div>

      {/* ── CTA ── */}
      <div
        ref={ctaRef}
        className="relative z-10 pb-16 px-4 flex flex-col items-center gap-3 sm:pb-24"
      >
        <p className="font-cabin text-sm text-elite-black/45">
          {t("followPrompt")}
        </p>
        <motion.a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={prefersReduced ? {} : { scale: 1.03 }}
          whileTap={prefersReduced ? {} : { scale: 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
          className="group inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] font-cabin text-sm font-semibold text-white shadow-lg shadow-pink-500/20"
        >
          <Instagram className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          {t("cta")}
        </motion.a>
        <p className="font-cabin text-[11px] text-elite-black/30 mt-1">
          {t("handle")}
        </p>
      </div>
    </section>
  );
}
