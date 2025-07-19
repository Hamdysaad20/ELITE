import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import GoodVibesSection from '@/components/GoodVibesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import NearbyCafesSection from '@/components/NearbyCafesSection';
import FindAndGet from '@/components/FindAndGet';
import LovedByLocals from '@/components/LovedByLocals';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <FindAndGet />
      <LovedByLocals />
      <GoodVibesSection />
      <TestimonialsSection />
      <NearbyCafesSection />
      <Footer />
    </main>
  );
}
