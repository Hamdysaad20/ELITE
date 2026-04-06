"use client";

import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import { CurvedLoop } from "@/components/CurvedLoop";

const MenuPreview = dynamic(() => import("@/components/MenuPreview"), {
  ssr: true,
});
const HowItWorks = dynamic(() => import("@/components/HowItWorks"), {
  ssr: true,
});
const SignaturePicks = dynamic(() => import("@/components/SignaturePicks"), {
  ssr: true,
});
const LovedByLocals = dynamic(() => import("@/components/LovedByLocals"), {
  ssr: true,
});
const WhyElite = dynamic(() => import("@/components/WhyElite"), { ssr: true });
const LoyaltyTeaser = dynamic(() => import("@/components/LoyaltyTeaser"), {
  ssr: true,
});
const LocationBar = dynamic(() => import("@/components/LocationBar"), {
  ssr: true,
});
const Footer = dynamic(() => import("@/components/Footer"), { ssr: true });

/* ── Wave dividers for smooth section transitions ── */

/** Thin decorative rule between two same-cream sections — signals intentional flow */
function CreamSectionBridge() {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 bg-elite-cream py-1 sm:py-2"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 sm:px-6">
        <div className="h-px flex-1 bg-elite-burgundy/[0.09]" />
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-elite-burgundy/[0.18]" />
          <div className="h-1.5 w-1.5 rounded-full bg-elite-burgundy/[0.26]" />
          <div className="h-1 w-1 rounded-full bg-elite-burgundy/[0.18]" />
        </div>
        <div className="h-px flex-1 bg-elite-burgundy/[0.09]" />
      </div>
    </div>
  );
}

function WaveBurgundyToCreamy() {
  return (
    <div className="wave-divider bg-elite-burgundy -mb-px">
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="w-full h-10 sm:h-14 md:h-16"
      >
        <path
          d="M0,0 C240,58 720,64 1080,42 S1440,0 1440,0 L1440,64 L0,64 Z"
          fill="var(--elite-cream)"
        />
      </svg>
    </div>
  );
}

function WaveCreamToWhiteBg() {
  return (
    <div className="wave-divider bg-elite-cream -mb-px">
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="w-full h-10 sm:h-14 md:h-16"
      >
        <path d="M0,0 C480,64 960,64 1440,0 L1440,64 L0,64 Z" fill="white" />
      </svg>
    </div>
  );
}

function WaveWhiteToBurgundy() {
  return (
    <div className="wave-divider bg-white -mb-px">
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="w-full h-10 sm:h-14 md:h-16"
      >
        <path
          d="M0,0 C360,6 720,64 1200,58 S1440,0 1440,0 L1440,64 L0,64 Z"
          fill="var(--elite-burgundy)"
        />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <main>
        {/* ① Hero */}
        <Hero />

        {/* ── curved text marquee — no background, rides the Hero wave curve ── */}
        <CurvedLoop
          marqueeText="Great Coffee ✦ Elite Vibes ✦ Faiyum ✦ Handcrafted Drinks ✦ Made With Love ✦"
          speed={1.5}
          curveAmount={90}
          direction="left"
          interactive={true}
          svgHeight="clamp(80px, 12vw, 180px)"
          className="fill-elite-burgundy/80 font-bebas text-[2.2rem] sm:text-[3rem] md:text-[4.5rem] uppercase tracking-wide"
        />

        {/* ② What are you craving? */}
        <MenuPreview />

        {/* bridge — same cream, signals intentional section flow */}
        <CreamSectionBridge />

        {/* ③ How it works — cream bg with pinned scroll animation */}
        <HowItWorks />

        {/* ── cream → white ── */}
        <WaveCreamToWhiteBg />

        {/* ④ Signature picks — white */}
        <SignaturePicks />

        {/* ── white → burgundy ── */}
        <WaveWhiteToBurgundy />

        {/* ⑤ Why Elite — burgundy */}
        <WhyElite />

        {/* ── burgundy → cream ── */}
        <WaveBurgundyToCreamy />

        {/* ⑥ Loved by locals — cream */}
        <LovedByLocals />

        {/* ⑦ Rewards & join — cream (same bg, no wave needed) */}
        <LoyaltyTeaser />

        {/* ── cream → white ── */}
        <WaveCreamToWhiteBg />

        {/* ⑧ Visit us — white */}
        <LocationBar />

        {/* ── white → burgundy (into footer) ── */}
        <WaveWhiteToBurgundy />
      </main>
      <Footer />
    </>
  );
}
