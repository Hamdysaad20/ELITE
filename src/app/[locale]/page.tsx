"use client";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Hero from "@/components/Hero";

const GoodVibesSection = dynamic(
  () => import("@/components/GoodVibesSection"),
  { ssr: true },
);
const TestimonialsSection = dynamic(
  () => import("@/components/TestimonialsSection"),
  { ssr: true },
);
const NearbyCafesSection = dynamic(
  () => import("@/components/NearbyCafesSection"),
  { ssr: true },
);
const FindAndGet = dynamic(() => import("@/components/FindAndGet"), {
  ssr: true,
});
const LovedByLocals = dynamic(() => import("@/components/LovedByLocals"), {
  ssr: true,
});
const Footer = dynamic(() => import("@/components/Footer"), { ssr: true });

export default function Home() {
  const { status } = useSession();

  return (
    <>
      <main className="pb-20 md:pb-0">
        <Hero />
        <FindAndGet />
        <LovedByLocals />
        <GoodVibesSection />
        <TestimonialsSection />
        <NearbyCafesSection />
      </main>
      <Footer />
    </>
  );
}
