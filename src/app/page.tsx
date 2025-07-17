import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import GoodVibesSection from '@/components/GoodVibesSection';
import FindAndGet from '@/components/FindAndGet';
import LovedByLocals from '@/components/LovedByLocals';

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <GoodVibesSection />
      <FindAndGet />
      <LovedByLocals />
    </main>
  );
}
