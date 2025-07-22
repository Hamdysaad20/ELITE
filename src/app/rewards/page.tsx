import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Gift, Star, Sparkles } from 'lucide-react';

export default function RewardsPage() {
  return (
    <main>
      <Navigation />
      
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-20 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-elite-cream/30 rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 border border-elite-cream/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-elite-cream/20 rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-elite-cream/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-elite-cream/30">
                <Gift className="w-12 h-12 text-elite-cream" />
              </div>
            </div>
            <h1 className="font-calistoga text-6xl md:text-7xl font-bold mb-6">
              Elite Rewards
            </h1>
            <p className="font-cabin text-xl md:text-2xl text-elite-cream/90 max-w-3xl mx-auto leading-relaxed">
              Earn points, unlock exclusive perks, and enjoy member-only benefits
            </p>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="min-h-screen flex items-center justify-center py-32 px-6">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center">
              {/* Elite Coffee Logo with enhanced styling */}
              <div className="flex justify-center mb-12">
                <div className="relative">
                  <div className="w-80 h-80 flex items-center justify-center">
                    <img
                      src="/images/logo_noBG.png"
                      alt="Elite Coffee Logo"
                      className="w-72 h-72 object-contain drop-shadow-lg"
                    />
                  </div>
                  {/* Decorative elements around logo */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-elite-burgundy/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-elite-burgundy" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-elite-burgundy/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-elite-burgundy" />
                  </div>
                </div>
              </div>

              {/* Main Message with enhanced typography */}
              <div className="mb-16">
                <h2 className="font-calistoga text-elite-burgundy text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
                  Coming Soon!
                </h2>
                <p className="font-cabin text-elite-black/70 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                  We're brewing something special for you. Our rewards program is being crafted with the same passion and quality that goes into every cup of Elite coffee.
                </p>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-3xl p-8">
                <h3 className="font-calistoga text-elite-burgundy text-2xl font-bold mb-4">
                  Stay Updated
                </h3>
                <p className="font-cabin text-elite-black/80 text-lg mb-6">
                  Be the first to know when our rewards program launches. Follow us on social media for updates!
                </p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="https://instagram.com/officieleliteeg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all duration-300 hover:scale-105"
                  >
                    Follow on Instagram
                  </a>
                  <a
                    href="https://facebook.com/officieleliteeg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all duration-300 hover:scale-105"
                  >
                    Follow on Facebook
                  </a>
                  <a
                    href="https://tiktok.com/@officieleliteeg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all duration-300 hover:scale-105"
                  >
                    Follow on TikTok
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
} 