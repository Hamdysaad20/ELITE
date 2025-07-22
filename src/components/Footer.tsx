'use client';

import { Instagram, Facebook, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';

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
              <p className="text-elite-cream font-cabin text-base leading-relaxed">
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
              <p className="text-elite-cream font-cabin text-sm">
                Explore our world
              </p>
            </div>
            <nav className="space-y-4">
              <Link href="/menu" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform">
                Menu
              </Link>
              <Link href="/rewards" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform relative">
                Rewards
                <span className="text-xs bg-elite-cream text-elite-burgundy px-1.5 py-0.5 rounded-full ml-1">Soon</span>
              </Link>
              <Link href="/shop" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform">
                Shop <span className="text-xs bg-elite-cream text-elite-burgundy px-1.5 py-0.5 rounded-full ml-1">Soon</span>
              </Link>
            </nav>
          </div>

          {/* Menu Categories */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-calistoga text-elite-white text-xl font-semibold">
                Menu Categories
              </h4>
              <p className="text-elite-cream font-cabin text-sm">
                Our offerings
              </p>
            </div>
            <nav className="space-y-4">
              <Link href="/menu/classic-drinks" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform">
                Classic Drinks
              </Link>
              <Link href="/menu/special-drinks" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform">
                Special Drinks
              </Link>
              <Link href="/menu/kids-corner" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform">
                Kids' Corner
              </Link>
              <Link href="/menu/food" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform relative">
                Food & Treats
                <span className="text-xs bg-elite-cream text-elite-burgundy px-1.5 py-0.5 rounded-full ml-1">Soon</span>
              </Link>
              <Link href="/menu/at-home-coffee" className="block font-cabin text-elite-white hover:text-elite-cream transition-all duration-300 text-base font-semibold tracking-wide hover:translate-x-2 transform relative">
                At Home Coffee
                <span className="text-xs bg-elite-cream text-elite-burgundy px-1.5 py-0.5 rounded-full ml-1">Soon</span>
              </Link>
            </nav>
          </div>

          {/* Location */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-calistoga text-elite-white text-xl font-semibold">
                Location
              </h4>
              <p className="text-elite-cream font-cabin text-sm">
                Visit us
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 font-cabin text-elite-white text-base font-semibold tracking-wide">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <div className="text-elite-white">
                    Faiyum, Governorate Club, next to the Governor's Villa
                  </div>
                  <div className="text-elite-cream/80 text-sm" dir="rtl">
                    الفيوم، نادي المحافظة، بجوار فيلا المحافظ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="text-center mb-12">
          <h4 className="font-calistoga text-elite-white text-2xl font-semibold mb-6">
            Follow Us
          </h4>
          <div className="flex justify-center space-x-6">
            {/* Instagram */}
            <a 
              href="https://instagram.com/officieleliteeg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-16 h-16 bg-elite-cream rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:bg-elite-white"
            >
              <Instagram className="w-8 h-8 text-elite-burgundy" />
            </a>
            
            {/* Facebook */}
            <a 
              href="https://www.facebook.com/profile.php?id=61577901386334" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-16 h-16 bg-elite-cream rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:bg-elite-white"
            >
              <Facebook className="w-8 h-8 text-elite-burgundy" />
            </a>
            
            {/* TikTok */}
            <a 
              href="https://tiktok.com/@officieleliteeg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-16 h-16 bg-elite-cream rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:bg-elite-white"
            >
              <svg className="w-8 h-8 text-elite-burgundy" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            
            {/* Website */}
            <a 
              href="https://officieleliteeg.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-16 h-16 bg-elite-cream rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:bg-elite-white"
            >
              <Globe className="w-8 h-8 text-elite-burgundy" />
            </a>
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
            <p className="font-cabin text-elite-white text-base font-medium">
              © 2025 Elite Coffee. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Terms of Service
              </a>
              <a href="#" className="font-cabin text-elite-white hover:text-elite-cream transition-colors duration-300 text-sm">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 