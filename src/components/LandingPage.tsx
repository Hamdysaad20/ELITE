"use client";

import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import { CurvedLoop } from "@/components/CurvedLoop";
import { LazySection } from "@/components/LazySection";

/* ── Skeleton placeholders for deferred sections ── */

function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`animate-pulse ${className ?? ""}`}>
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <div className="mx-auto h-8 w-48 rounded-lg bg-current opacity-[0.07]" />
        <div className="mx-auto h-4 w-72 rounded bg-current opacity-[0.05]" />
      </div>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <section className="bg-elite-cream">
      <SectionSkeleton className="text-elite-burgundy" />
      <div className="h-[clamp(380px,55vw,680px)]" />
    </section>
  );
}

function LocationSkeleton() {
  return (
    <section className="bg-white px-4 py-16 sm:py-24">
      <SectionSkeleton className="text-elite-black" />
      <div className="mx-auto max-w-6xl h-[420px] rounded-[2.5rem] bg-elite-cream/30 animate-pulse" />
    </section>
  );
}

function FooterSkeleton() {
  return (
    <footer className="bg-elite-burgundy min-h-[300px]">
      <SectionSkeleton className="text-white" />
    </footer>
  );
}

/* ── Above-fold: SSR + eager ── */
const MenuPreview = dynamic(() => import("@/components/MenuPreview"), {
  ssr: true,
});
const HowItWorks = dynamic(() => import("@/components/HowItWorks"), {
  ssr: true,
});
const SignaturePicks = dynamic(() => import("@/components/SignaturePicks"), {
  ssr: true,
});

/* ── Below-fold: client-only, deferred ── */
const LovedByLocals = dynamic(() => import("@/components/LovedByLocals"), {
  ssr: false,
});
const WhyElite = dynamic(() => import("@/components/WhyElite"), {
  ssr: false,
});
const LoyaltyTeaser = dynamic(() => import("@/components/LoyaltyTeaser"), {
  ssr: false,
});
const InstagramGallery = dynamic(
  () =>
    import("@/components/InstagramGallery").then((m) => ({
      default: m.InstagramGallery,
    })),
  { ssr: false, loading: () => <GallerySkeleton /> },
);
const LocationBar = dynamic(() => import("@/components/LocationBar"), {
  ssr: false,
  loading: () => <LocationSkeleton />,
});
const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => <FooterSkeleton />,
});

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

        {/* ── curved text marquee — cream background strip ── */}
        <section className="bg-elite-cream w-full py-2">
          <CurvedLoop
            marqueeText="Great Coffee ✦ Elite Vibes ✦ Faiyum ✦ Handcrafted Drinks ✦ Made With Love ✦"
            speed={1.5}
            curveAmount={90}
            direction="left"
            interactive={true}
            svgHeightClass="h-20 sm:h-28 md:h-36 lg:h-44"
            className="fill-elite-burgundy font-bebas text-[2.2rem] sm:text-[3rem] md:text-[4.5rem] uppercase tracking-wide"
          />
        </section>

        {/* ② What are you craving? */}
        <MenuPreview />

        {/* bridge — same cream, signals intentional section flow */}
        <CreamSectionBridge />

        {/* ③ How it works — cream bg with pinned scroll animation */}
        <HowItWorks />

        {/* ── cream → white ── */}
        <WaveCreamToWhiteBg />

        {/* ④ Signature picks — white */}
        <LazySection
          rootMargin="400px"
          minHeight="600px"
          fallback={
            <div className="bg-white min-h-[600px]">
              <SectionSkeleton className="text-elite-black" />
            </div>
          }
        >
          <SignaturePicks />
        </LazySection>

        {/* ── white → burgundy ── */}
        <WaveWhiteToBurgundy />

        {/* ⑤ Why Elite — burgundy */}
        <LazySection
          rootMargin="400px"
          minHeight="500px"
          fallback={
            <div className="bg-elite-burgundy min-h-[500px]">
              <SectionSkeleton className="text-elite-cream" />
            </div>
          }
        >
          <WhyElite />
        </LazySection>

        {/* ── burgundy → cream ── */}
        <WaveBurgundyToCreamy />

        {/* ⑥ Loved by locals — cream */}
        <LazySection
          rootMargin="300px"
          minHeight="500px"
          fallback={
            <div className="bg-elite-cream min-h-[500px]">
              <SectionSkeleton className="text-elite-burgundy" />
            </div>
          }
        >
          <LovedByLocals />
        </LazySection>

        {/* ⑦ Rewards & join — cream (same bg, no wave needed) */}
        <LazySection
          rootMargin="300px"
          minHeight="600px"
          fallback={
            <div className="bg-elite-cream min-h-[600px]">
              <SectionSkeleton className="text-elite-burgundy" />
            </div>
          }
        >
          <LoyaltyTeaser />
        </LazySection>

        {/* ── cream section bridge ── */}
        <CreamSectionBridge />

        {/* ⑧ Instagram gallery — cream */}
        <LazySection
          rootMargin="200px"
          minHeight="600px"
          fallback={<GallerySkeleton />}
        >
          <InstagramGallery />
        </LazySection>

        {/* ── cream → white ── */}
        <WaveCreamToWhiteBg />

        {/* ⑨ Visit us — white */}
        <LazySection
          rootMargin="200px"
          minHeight="500px"
          fallback={<LocationSkeleton />}
        >
          <LocationBar />
        </LazySection>

        {/* ── white → burgundy (into footer) ── */}
        <WaveWhiteToBurgundy />
      </main>
      <Footer />
    </>
  );
}
