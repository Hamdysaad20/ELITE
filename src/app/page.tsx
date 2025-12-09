"use client";

import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import Hero from "@/components/Hero";
import GoodVibesSection from "@/components/GoodVibesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import NearbyCafesSection from "@/components/NearbyCafesSection";
import FindAndGet from "@/components/FindAndGet";
import LovedByLocals from "@/components/LovedByLocals";
import Footer from "@/components/Footer";

export default function Home() {
  const { status } = useSession();

  return (
    <>
      <div className="hidden md:block">
        <Navigation />
      </div>
      <main className="pb-20 md:pb-0">
        <Hero />
        <FindAndGet />
        <LovedByLocals />
        <GoodVibesSection />
        <TestimonialsSection />
        <NearbyCafesSection />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      {status === "authenticated" && <MobileNavigation />}
    </>
  );
}
