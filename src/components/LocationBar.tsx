"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { MapPin, MessageCircle, Clock, Navigation } from "lucide-react";
import { useLandingReveal } from "@/hooks/useLandingReveal";

const GOOGLE_MAPS_URL =
  "https://maps.google.com/?q=Elite+Cafee+Faiyum+Governorate+Club";
const FACEBOOK_URL = "https://www.facebook.com/elitecafee";

export default function LocationBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("locationBar");

  useLandingReveal({
    rootRef: sectionRef,
    revealTargets: [headingRef, cardRef],
    start: "top 84%",
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-24 md:py-32 will-change-transform"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[18%] end-[5%] h-56 w-56 rounded-full bg-elite-cream/60 blur-3xl" />
        <div className="absolute bottom-[14%] start-[8%] h-44 w-44 rounded-full bg-elite-burgundy/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Heading */}
        <div ref={headingRef} className="mb-12 text-center sm:mb-16">
          <h2 className="font-calistoga text-elite-black text-3xl leading-tight tracking-[-0.02em] sm:text-4xl md:text-[2.8rem] lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-cabin text-sm leading-relaxed text-elite-black/50 sm:text-base md:text-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Info card */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-[2.5rem] border border-elite-burgundy/8 bg-gradient-to-br from-elite-cream/60 via-elite-cream/30 to-white shadow-sm"
        >
          <div className="relative p-8 sm:p-10 md:p-14 lg:p-16">
            {/* Ghost map pin watermark */}
            <div
              className="absolute top-6 end-6 pointer-events-none sm:top-10 sm:end-10"
              aria-hidden="true"
            >
              <MapPin
                className="h-28 w-28 text-elite-burgundy/[0.04] sm:h-36 sm:w-36"
                strokeWidth={0.8}
              />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              {/* Left: location info */}
              <div>
                <div className="mb-5 flex items-center gap-3.5">
                  <div className="pin-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-elite-burgundy/8">
                    <MapPin className="h-5 w-5 text-elite-burgundy" />
                  </div>
                  <h3 className="font-calistoga text-xl leading-snug text-elite-black sm:text-2xl">
                    {t("name")}
                  </h3>
                </div>

                <p className="ms-[3.875rem] max-w-lg font-cabin text-base leading-relaxed text-elite-black/55 sm:text-lg">
                  {t("address")}
                </p>

                <div className="ms-[3.875rem] mt-4 flex items-center gap-2 text-elite-black/40">
                  <Clock className="h-4 w-4" />
                  <span className="font-cabin text-sm sm:text-base">
                    {t("hours")}
                  </span>
                </div>
              </div>

              {/* Right: CTAs */}
              <div className="ms-[3.875rem] flex flex-col gap-3 sm:flex-row lg:ms-0 lg:flex-col xl:flex-row">
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
      </div>
    </section>
  );
}
