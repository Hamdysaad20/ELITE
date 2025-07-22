import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Coffee, ShoppingBag, Clock } from 'lucide-react';

export default function ShopPage() {
  return (
    <main>
      <Navigation />
      
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-elite-cream/20 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-elite-cream" />
              </div>
            </div>
            <h1 className="font-calistoga text-5xl md:text-6xl font-bold mb-4">
              Elite Shop
            </h1>
            <p className="font-cabin text-xl text-elite-cream/90 max-w-2xl mx-auto">
              Premium coffee beans, brewing equipment, and exclusive merchandise
            </p>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            {/* Coming Soon Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy rounded-full flex items-center justify-center shadow-xl">
                <Clock className="w-12 h-12 text-elite-cream" />
              </div>
            </div>

            {/* Main Message */}
            <h2 className="font-calistoga text-elite-burgundy text-4xl md:text-5xl font-bold mb-6">
              Coming Soon!
            </h2>
            
            <p className="font-cabin text-elite-black/80 text-xl mb-8 leading-relaxed">
              We're brewing something special for you. Our online shop will feature:
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-elite-burgundy/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Coffee className="w-6 h-6 text-elite-burgundy" />
                </div>
                <h3 className="font-calistoga text-elite-burgundy text-xl font-bold mb-2">
                  Premium Beans
                </h3>
                <p className="font-cabin text-elite-black/70 text-sm">
                  Carefully selected coffee beans from around the world
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-elite-burgundy/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <ShoppingBag className="w-6 h-6 text-elite-burgundy" />
                </div>
                <h3 className="font-calistoga text-elite-burgundy text-xl font-bold mb-2">
                  Brewing Equipment
                </h3>
                <p className="font-cabin text-elite-black/70 text-sm">
                  Professional-grade coffee makers and accessories
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-elite-burgundy/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Coffee className="w-6 h-6 text-elite-burgundy" />
                </div>
                <h3 className="font-calistoga text-elite-burgundy text-xl font-bold mb-2">
                  Exclusive Merch
                </h3>
                <p className="font-cabin text-elite-black/70 text-sm">
                  Elite Coffee branded merchandise and gifts
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-3xl p-8">
              <h3 className="font-calistoga text-elite-burgundy text-2xl font-bold mb-4">
                Stay Updated
              </h3>
              <p className="font-cabin text-elite-black/80 text-lg mb-6">
                Be the first to know when our shop opens. Follow us on social media for updates!
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
                  href="https://www.facebook.com/profile.php?id=61577901386334" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all duration-300 hover:scale-105"
                >
                  Follow on Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
} 