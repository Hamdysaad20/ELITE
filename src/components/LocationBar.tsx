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
      className="bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-20 will-change-transform"
    >
      <div className="max-w-4xl mx-auto">
        <div ref={headingRef} className="mb-8 text-center sm:mb-10">
          <h2 className="font-calistoga text-elite-black text-2xl leading-tight tracking-[-0.02em] sm:text-3xl md:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-cabin text-sm leading-relaxed text-elite-black/55 sm:text-base md:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div
          ref={cardRef}
          className="bg-gradient-to-br from-elite-cream/78 to-elite-cream/42 rounded-[2rem] border border-elite-burgundy/8 p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="pin-pulse flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-elite-burgundy/10 sm:h-12 sm:w-12">
                <MapPin className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-elite-burgundy" />
              </div>
              <div className="min-w-0">
                <h3 className="mb-1 font-calistoga text-lg leading-snug text-elite-black sm:text-xl">
                  {t("name")}
                </h3>
                <p className="mb-3 max-w-xl font-cabin text-sm leading-relaxed text-elite-black/55 sm:text-[15px]">
                  {t("address")}
                </p>
                <div className="flex items-center gap-1.5 text-elite-black/45">
                  <Clock className="w-3.5 h-3.5" />
                  <p className="font-cabin text-xs sm:text-sm">{t("hours")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-elite-burgundy px-6 py-3 font-cabin text-sm font-semibold text-elite-cream shadow-md shadow-elite-burgundy/15 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-elite-burgundy/25 active:scale-95 whitespace-nowrap"
              >
                <Navigation className="w-4 h-4" />
                {t("getDirections")}
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-elite-burgundy/10 bg-white/80 px-5 py-3 font-cabin text-sm text-elite-black/52 transition-colors hover:text-elite-burgundy whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                {t("messageUs")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
