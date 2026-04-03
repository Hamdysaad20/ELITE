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
const Testimonials = dynamic(() => import("@/components/Testimonials"), {
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
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 md:h-14"
      >
        <path
          d="M0,0 C480,56 960,56 1440,0 L1440,56 L0,56 Z"
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
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 md:h-14"
      >
        <path d="M0,0 C360,56 1080,56 1440,0 L1440,56 L0,56 Z" fill="white" />
      </svg>
    </div>
  );
}

function WaveWhiteToBurgundy() {
  return (
    <div className="wave-divider bg-white -mb-px">
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 md:h-14"
      >
        <path
          d="M0,0 C480,56 960,56 1440,0 L1440,56 L0,56 Z"
          fill="var(--elite-burgundy)"
        />
      </svg>
    </div>
  );
}

function WaveWhiteToCreamy() {
  return (
    <div className="wave-divider bg-white -mb-px">
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 md:h-14"
      >
        <path
          d="M0,0 C360,56 1080,56 1440,0 L1440,56 L0,56 Z"
          fill="var(--elite-cream)"
        />
      </svg>
    </div>
  );
}

/* Transitions into/out of the dark burgundy Testimonials section (#3a0e18) */
function WaveCreamToDark() {
  return (
    <div className="wave-divider bg-elite-cream -mb-px">
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 md:h-14"
      >
        <path d="M0,0 C480,56 960,56 1440,0 L1440,56 L0,56 Z" fill="#3a0e18" />
      </svg>
    </div>
  );
}

function WaveDarkToCreamy() {
  return (
    <div className="wave-divider -mb-px" style={{ background: "#3a0e18" }}>
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-12 md:h-14"
      >
        <path
          d="M0,0 C360,56 1080,56 1440,0 L1440,56 L0,56 Z"
          fill="var(--elite-cream)"
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

        {/* ── cream → dark (Testimonials bg) ── */}
        <WaveCreamToDark />

        {/* ⑦ Testimonials — full-bleed matcha photo */}
        <Testimonials />

        {/* ── dark → cream ── */}
        <WaveDarkToCreamy />

        {/* ⑧ Rewards & join — cream */}
        <LoyaltyTeaser />

        {/* ── cream → white ── */}
        <WaveCreamToWhiteBg />

        {/* ⑨ Visit us — white */}
        <LocationBar />

        {/* ── white → burgundy (into footer) ── */}
        <WaveWhiteToBurgundy />
      </main>
      <Footer />
    </>
  );
}
