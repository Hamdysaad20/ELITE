"use client";

import dynamic from "next/dynamic";
import Hero from "@/components/Hero";

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

        {/* ② What are you craving? */}
        <MenuPreview />

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
