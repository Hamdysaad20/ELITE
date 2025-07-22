'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllCategories } from '@/lib/menuData';
import { ChevronRight, Coffee, Sparkles, Heart, Utensils, Home } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function MenuPage() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const categories = getAllCategories();

  // Function to render icons based on string names
  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-6 h-6" };
    switch (iconName) {
      case 'coffee':
        return <Coffee {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'utensils':
        return <div className="w-6 h-6 bg-elite-burgundy rounded-full"></div>;
      case 'home':
        return <Home {...iconProps} />;
      default:
        return <Coffee {...iconProps} />;
    }
  };

  // Handle animation completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationPlayed(true);
    }, 1700); // 0.5s delay + 1.2s animation duration

    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      <Navigation />
      <div className="min-h-screen bg-elite-burgundy">
      {/* Hero Section - Menu Text with Overlay Image */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy via-elite-dark-burgundy to-elite-burgundy opacity-90"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[60vh] px-4">
          
          {/* Menu Text - Center */}
          <h1 className="font-calistoga text-elite-cream text-6xl md:text-8xl lg:text-[12rem] font-bold leading-none tracking-tight opacity-90 relative z-10">
            MENU
        </h1>
          
          {/* Drink Image Overlay - Much Bigger */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/images/drink-hero.avif"
              alt="Featured Drink"
              className={`w-64 h-64 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] object-contain ${
                animationPlayed ? 'drink-overlay-animation animated' : 'drink-overlay-animation'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Categories Section - Much Smaller */}
      <div className="relative z-20 bg-elite-cream min-h-[25vh] rounded-t-[3rem] md:rounded-t-[3rem] -mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          
          {/* Mobile Header - Smaller */}
          <div className="md:hidden text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-xl px-4 py-2 mb-2">
              <h2 className="font-calistoga text-elite-burgundy text-2xl font-bold">
                What's Your Craving?
              </h2>
            </div>
            <p className="font-cabin text-elite-black/90 text-sm font-medium">
              Tap to explore our delicious menu
            </p>
          </div>
          
          {/* Desktop Header - Smaller */}
          <div className="hidden md:block text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-2xl px-8 py-4 mb-4">
              <h2 className="font-calistoga text-elite-burgundy text-3xl lg:text-4xl font-bold">
                Explore Our Menu
              </h2>
            </div>
            <p className="font-cabin text-elite-black/90 text-lg max-w-2xl mx-auto font-medium">
              Discover our carefully crafted selection of drinks and delicious food items
            </p>
          </div>

          {/* Mobile Categories - Much Smaller */}
          <div className="md:hidden space-y-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.comingSoon ? '#' : `/menu/${category.id}`}
                className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ease-in-out transform active:scale-98 ${
                  category.comingSoon 
                    ? 'cursor-not-allowed opacity-70' 
                    : 'cursor-pointer shadow-xl hover:shadow-2xl'
                }`}
              >
                {/* Mobile Card Design - Much Smaller */}
                <div className={`relative h-24 rounded-2xl overflow-hidden ${
                  category.comingSoon 
                    ? 'bg-gradient-to-r from-elite-dark-cream to-elite-cream' 
                    : 'bg-gradient-to-br from-elite-burgundy via-elite-dark-burgundy to-elite-burgundy'
                }`}>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                  
                  {/* Mobile Layout: Icon + Text Side by Side - Smaller */}
                  <div className="flex items-center h-full p-4 relative z-10">
                    {/* Icon - Smaller */}
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        category.comingSoon 
                          ? 'bg-elite-burgundy/20 text-elite-burgundy' 
                          : 'bg-elite-cream/25 text-elite-cream'
                      }`}>
                        <span className="text-lg">
                          {renderIcon(category.icon)}
                        </span>
                      </div>
                    </div>

                    {/* Content - Smaller */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-calistoga text-lg font-bold ${
                          category.comingSoon ? 'text-elite-burgundy' : 'text-elite-cream'
                        }`}>
                          {category.name}
                        </h3>
                        {category.comingSoon && (
                          <span className="bg-elite-burgundy text-elite-cream px-2 py-0.5 rounded-full text-xs font-cabin font-bold shadow-md">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className={`font-cabin text-xs mb-1 line-clamp-1 ${
                        category.comingSoon ? 'text-elite-burgundy/80' : 'text-elite-cream/95'
                      }`}>
                        {category.description}
                      </p>
                      
                      {/* Subcategories Count - Smaller */}
                      {!category.comingSoon && category.subCategories.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-elite-cream/80">
                            {category.subCategories.length} categories
                          </span>
                          <div className="w-6 h-6 bg-elite-cream/20 rounded-full flex items-center justify-center">
                            <ChevronRight className="w-3 h-3 text-elite-cream" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Touch Effect - Enhanced */}
                  {!category.comingSoon && (
                    <div className="absolute inset-0 bg-gradient-to-r from-elite-burgundy/30 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Categories - Much Smaller Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.comingSoon ? '#' : `/menu/${category.id}`}
                className={`group relative overflow-hidden rounded-3xl transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-2xl ${
                  category.comingSoon 
                    ? 'cursor-not-allowed opacity-70' 
                    : 'cursor-pointer hover:shadow-elite-burgundy/30'
                }`}
                onMouseEnter={() => !category.comingSoon && setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Desktop Card Background - Much Smaller */}
                <div className={`relative h-48 rounded-2xl overflow-hidden ${
                  category.comingSoon 
                    ? 'bg-gradient-to-br from-elite-dark-cream to-elite-cream' 
                    : 'bg-gradient-to-br from-elite-burgundy via-elite-dark-burgundy to-elite-burgundy'
                }`}>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10"></div>
                  
                  {/* Icon - Smaller */}
                  <div className={`absolute top-4 left-4 p-2 rounded-xl ${
                    category.comingSoon 
                      ? 'bg-elite-burgundy/20 text-elite-burgundy' 
                      : 'bg-elite-cream/25 text-elite-cream'
                  }`}>
                    <span className="text-2xl lg:text-3xl">
                      {renderIcon(category.icon)}
                    </span>
                  </div>

                  {/* Coming Soon Badge - Smaller */}
                  {category.comingSoon && (
                    <div className="absolute top-4 right-4 bg-elite-burgundy text-elite-cream px-3 py-1 rounded-full text-xs font-cabin font-bold shadow-md">
          Coming Soon
                    </div>
                  )}

                  {/* Content - Smaller */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-elite-cream">
                    <h3 className={`font-calistoga text-xl lg:text-2xl mb-2 font-bold ${
                      category.comingSoon ? 'text-elite-burgundy' : 'text-elite-cream'
                    }`}>
                      {category.name}
                    </h3>
                    <p className={`font-cabin text-sm mb-3 line-clamp-1 ${
                      category.comingSoon ? 'text-elite-burgundy/80' : 'text-elite-cream/95'
                    }`}>
                      {category.description}
                    </p>
                    
                    {/* Subcategories Preview - Smaller */}
                    {!category.comingSoon && category.subCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {category.subCategories.slice(0, 2).map((sub) => (
                          <span 
                            key={sub.id}
                            className="bg-elite-cream/25 text-elite-cream text-xs px-2 py-0.5 rounded-full font-cabin font-semibold shadow-sm"
                          >
                            {sub.name}
                          </span>
                        ))}
                        {category.subCategories.length > 2 && (
                          <span className="bg-elite-cream/25 text-elite-cream text-xs px-2 py-0.5 rounded-full font-cabin font-semibold shadow-sm">
                            +{category.subCategories.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Arrow Icon - Smaller */}
                    {!category.comingSoon && (
                      <div className={`flex items-center justify-between transition-all duration-300 ${
                        hoveredCategory === category.id ? 'transform translate-x-2' : ''
                      }`}>
                        <span className="font-cabin font-bold text-sm">
                          Explore {category.name}
                        </span>
                        <div className={`w-8 h-8 bg-elite-cream/25 rounded-full flex items-center justify-center transition-all duration-300 ${
                          hoveredCategory === category.id ? 'transform translate-x-1 scale-110' : ''
                        }`}>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hover Effect Overlay - Enhanced */}
                  {!category.comingSoon && (
                    <div className={`absolute inset-0 bg-gradient-to-t from-elite-burgundy/90 via-elite-burgundy/20 to-transparent transition-all duration-500 ${
                      hoveredCategory === category.id ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA - Enhanced */}
          <div className="text-center mt-16 md:mt-20">
            {/* Mobile CTA - Enhanced */}
            <div className="md:hidden">
              <div className="bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-2xl p-6 mb-6">
                <p className="font-cabin text-elite-black/90 text-base font-medium mb-4">
                  Ready to order?
                </p>
                <Link
                  href="/menu/classic-drinks"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-bold text-base transition-all duration-300 active:scale-95 active:shadow-xl shadow-lg"
                >
                  Browse Drinks
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            
            {/* Desktop CTA - Enhanced */}
            <div className="hidden md:block">
              <div className="bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-3xl p-12 mb-8">
                <p className="font-cabin text-elite-black/90 text-xl lg:text-2xl font-medium mb-8">
                  Can't decide? Let us help you find your perfect match!
                </p>
                <Link
                  href="/menu/classic-drinks"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream px-12 py-6 rounded-full font-cabin font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-elite-burgundy/40 shadow-xl"
                >
                  Start with Drinks
                  <ChevronRight className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </div>

          {/* Character Spotlight - Mobile Only - Enhanced */}
          <div className="md:hidden mt-16">
            <div className="bg-gradient-to-br from-elite-burgundy/15 via-elite-dark-burgundy/10 to-elite-burgundy/15 rounded-3xl p-8 border-2 border-elite-burgundy/20 shadow-xl">
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-elite-burgundy/20 to-elite-dark-burgundy/20 rounded-2xl px-4 py-2 mb-4">
                  <h3 className="font-calistoga text-elite-burgundy text-2xl font-bold">
                    Meet Our Characters!
                  </h3>
                </div>
                <p className="font-cabin text-elite-black/90 text-base font-medium mb-6">
                  Discover magical drinks with Chocoloco, VanillaBella, and Mangoboom
                </p>
                <Link
                  href="/menu/kids-corner"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-bold text-base transition-all duration-300 active:scale-95 active:shadow-xl shadow-lg"
                >
                  Explore Kids' Corner
                  <ChevronRight className="w-4 h-4" />
                </Link>
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