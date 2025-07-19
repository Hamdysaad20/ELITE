'use client';

import { Instagram, Facebook, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-elite-burgundy text-elite-white relative">

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            {/* Tagline */}
            <div className="space-y-4">
              <h3 className="font-calistoga text-elite-white text-3xl md:text-4xl leading-tight">
                Life Begins
                <br />
                After Coffee
              </h3>
              <p className="text-elite-cream font-cabin text-sm leading-relaxed">
                Experience the perfect blend of tradition and innovation in every cup.
              </p>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-calistoga text-elite-white text-xl font-semibold">
                Navigation
              </h4>
              <p className="text-elite-cream font-cabin text-xs">
                Explore our world
              </p>
            </div>
            <nav className="space-y-3">
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Menu
              </a>
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Locations
              </a>
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                About Us
              </a>
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                News
              </a>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-calistoga text-elite-white text-xl font-semibold">
                Categories
              </h4>
              <p className="text-elite-cream font-cabin text-xs">
                Our offerings
              </p>
            </div>
            <nav className="space-y-3">
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Coffee
              </a>
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Cold Drinks
              </a>
              <a href="#" className="block font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Bakery
              </a>
            </nav>
          </div>

          {/* Social Media */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-calistoga text-elite-white text-xl font-semibold">
                Follow Us
              </h4>
              <p className="text-elite-cream font-cabin text-xs">
                Stay connected
              </p>
            </div>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a 
                href="https://instagram.com/officieleliteeg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-elite-cream rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              >
                <Instagram className="w-6 h-6 text-elite-burgundy" />
              </a>
              
              {/* Facebook */}
              <a 
                href="https://www.facebook.com/profile.php?id=61577901386334" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-elite-cream rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              >
                <Facebook className="w-6 h-6 text-elite-burgundy" />
              </a>
              
              {/* TikTok */}
              <a 
                href="https://tiktok.com/@officieleliteeg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-elite-cream rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              >
                <svg className="w-6 h-6 text-elite-burgundy" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              
              {/* Website */}
              <a 
                href="https://officieleliteeg.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-elite-cream rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              >
                <Globe className="w-6 h-6 text-elite-burgundy" />
              </a>
            </div>
          </div>
        </div>

        {/* Large Central Logo */}
        <div className="text-center mb-8">
          <h2 className="font-calistoga text-elite-white text-7xl md:text-8xl lg:text-9xl xl:text-[12rem] 2xl:text-[14rem] font-bold leading-none tracking-wider">
            ELITE COFFEE
          </h2>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-elite-cream/20 border-t border-elite-cream/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="font-cabin text-elite-white text-sm">
              2025 © Elite Cafee
            </p>
            <p className="font-cabin text-elite-white text-sm">
              Licenses
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 