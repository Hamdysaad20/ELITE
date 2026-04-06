"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin,
  MessageCircle,
  Clock,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useLandingReveal } from "@/hooks/useLandingReveal";
import { cn } from "@/lib/utils";

const GOOGLE_MAPS_URL =
  "https://maps.google.com/?q=Elite+Cafee+Faiyum+Governorate+Club";
const FACEBOOK_URL = "https://www.facebook.com/elitecafee";

const PLACE_PHOTOS = [
  {
    src: "/images/ourplace/fc58696a-aab2-4167-b896-d955f68c8da4.JPG",
    alt: "Elite cafe seating area with panoramic windows",
  },
  {
    src: "/images/ourplace/d90ac0fe-cec2-42f0-a7c8-4a9586562a2f.JPG",
    alt: "Elite branded counter with illuminated logo",
  },
  {
    src: "/images/ourplace/wideSideview.JPG",
    alt: "Elite cafe with barista counter and menu boards",
  },
  {
    src: "/images/ourplace/wide.JPG",
    alt: "Elite cafe full seating area at night",
  },
  {
    src: "/images/ourplace/wide2.JPG",
    alt: "Elite cafe busy evening atmosphere",
  },
] as const;

export default function LocationBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("locationBar");

  const [active, setActive] = useState(0);

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef, contentRef],
    start: "top 84%",
  });

  function prev() {
    setActive((n) => (n === 0 ? PLACE_PHOTOS.length - 1 : n - 1));
  }
  function next() {
    setActive((n) => (n === PLACE_PHOTOS.length - 1 ? 0 : n + 1));
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-24 md:py-32"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[18%] end-[5%] h-56 w-56 rounded-full bg-elite-cream/60 blur-3xl" />
        <div className="absolute bottom-[14%] start-[8%] h-44 w-44 rounded-full bg-elite-burgundy/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Heading */}
        <div ref={headingRef} className="mb-12 text-center sm:mb-16">
          <h2 className="font-calistoga text-elite-black text-3xl leading-tight tracking-[-0.02em] sm:text-4xl md:text-[2.8rem] lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-cabin text-sm leading-relaxed text-elite-black/50 sm:text-base md:text-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Two-column card */}
        <div
          ref={contentRef}
          className="overflow-hidden rounded-[2.5rem] border border-elite-burgundy/8 bg-gradient-to-br from-elite-cream/60 via-elite-cream/30 to-white shadow-sm lg:grid lg:grid-cols-[1fr_1fr] lg:min-h-[420px]"
        >
          {/* ── Left: photo carousel ── */}
          <div className="group relative aspect-[4/3] overflow-hidden lg:aspect-auto">
            {PLACE_PHOTOS.map((photo, i) => (
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={i === 0}
                className={cn(
                  "object-cover transition-opacity duration-700 ease-in-out",
                  i === active ? "opacity-100" : "opacity-0",
                )}
              />
            ))}

            {/* Gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Prev / Next arrows */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute start-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute end-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 start-0 end-0 flex justify-center gap-1.5">
              {PLACE_PHOTOS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === active
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/75",
                  )}
                />
              ))}
            </div>

            {/* Thumbnail strip */}
            <div className="absolute bottom-12 start-3 end-3 hidden sm:flex gap-2 justify-center">
              {PLACE_PHOTOS.map((photo, i) => (
                <button
                  key={photo.src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={cn(
                    "relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                    i === active
                      ? "border-white scale-105 shadow-lg"
                      : "border-white/30 opacity-70 hover:opacity-100",
                  )}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: info ── */}
          <div className="relative flex flex-col justify-center p-8 sm:p-10 md:p-12 lg:p-14">
            {/* Ghost map pin watermark */}
            <div
              className="absolute top-6 end-6 pointer-events-none"
              aria-hidden="true"
            >
              <MapPin
                className="h-24 w-24 text-elite-burgundy/[0.05] sm:h-32 sm:w-32"
                strokeWidth={0.8}
              />
            </div>

            {/* Name + address */}
            <div className="relative mb-8">
              <div className="mb-5 flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-elite-burgundy/8">
                  <MapPin className="h-5 w-5 text-elite-burgundy" />
                </div>
                <h3 className="font-calistoga text-xl leading-snug text-elite-black sm:text-2xl">
                  {t("name")}
                </h3>
              </div>

              <p className="ms-[3.875rem] max-w-sm font-cabin text-base leading-relaxed text-elite-black/55 sm:text-lg">
                {t("address")}
              </p>

              <div className="ms-[3.875rem] mt-4 flex items-center gap-2 text-elite-black/40">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-cabin text-sm sm:text-base">
                  {t("hours")}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-elite-burgundy px-7 py-3.5 font-cabin text-sm font-semibold text-elite-cream shadow-md shadow-elite-burgundy/15 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-elite-burgundy/25 active:scale-95 whitespace-nowrap"
              >
                <Navigation className="h-4 w-4" />
                {t("getDirections")}
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-elite-burgundy/12 bg-white/80 px-6 py-3.5 font-cabin text-sm font-medium text-elite-black/55 transition-all duration-200 hover:border-elite-burgundy/25 hover:text-elite-burgundy whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" />
                {t("messageUs")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
