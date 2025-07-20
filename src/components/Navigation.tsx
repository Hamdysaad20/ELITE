'use client';

import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import Link from 'next/link';

export default function Navigation() {
  const [showPromo, setShowPromo] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Promotion Banner */}
      {showPromo && (
        <div className="bg-elite-cream text-elite-black text-center py-4 px-6 relative animate-in slide-in-from-top duration-500">
          <p className="font-cabin text-base font-semibold tracking-wide">
            Buy one coffee, get one free — this week only (April 14-20)
          </p>
          <button
            onClick={() => setShowPromo(false)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-elite-black hover:opacity-70 transition-all duration-300 hover:scale-110"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={` backdrop-blur-sm sticky top-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled ? '' : ''
      }`}>
        {/* Desktop Navigation */}
        <div className="hidden md:block transition-all duration-500 ease-in-out">
          <div className={`max-w-7xl mx-auto flex items-center justify-center transition-all duration-500 ease-in-out ${
            isScrolled ? 'py-3 px-6' : 'py-8 px-8'
          }`}>
            {/* Pilled Navigation Container */}
            <div className={`bg-elite-cream rounded-full flex items-center space-x-10 shadow-2xl transition-all duration-500 ease-in-out ${
              isScrolled ? 'px-10 py-4' : 'px-16 py-6'
            }`}>
              <Link 
                href="/" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Home
                </span>
              </Link>
              <Link 
                href="/menu" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Menu
                </span>
              </Link>
              
              {/* Center Logo */}
              <div className={`rounded-lg flex items-center justify-center px-10 transition-all duration-500 ease-in-out ${
                isScrolled ? 'h-20 -my-3' : 'h-32 -my-8'
              }`}>
                <img
                  src="/images/logo_noBG.png"
                  alt="Elite Coffee Logo"
                  className={`w-auto object-contain transition-all duration-500 ease-in-out ${
                    isScrolled ? 'h-16' : 'h-24'
                  }`}
                />
              </div>
              
              <Link 
                href="/rewards" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Rewards
                </span>
              </Link>
              <a 
                href="#location" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Location
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden bg-elite-cream transition-all duration-500 ease-in-out ${
          isScrolled ? 'py-3 px-4' : 'py-6 px-6'
        }`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className={`rounded-lg flex items-center justify-center px-4 transition-all duration-500 ease-in-out ${
              isScrolled ? 'h-16 -my-2' : 'h-20 -my-3'
            }`}>
              <img
                src="/images/logo_noBG.png"
                alt="Elite Coffee Logo"
                className={`w-auto object-contain transition-all duration-500 ease-in-out ${
                  isScrolled ? 'h-12' : 'h-16'
                }`}
              />
            </div>

            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`bg-elite-cream rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 border-2 border-elite-burgundy/20 ${
                isScrolled ? 'w-10 h-10' : 'w-12 h-12'
              }`}
            >
              {mobileMenuOpen ? (
                <X size={isScrolled ? 20 : 24} className="text-elite-black transition-all duration-300" />
              ) : (
                <Menu size={isScrolled ? 20 : 24} className="text-elite-black transition-all duration-300" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-4 py-4 border-t border-elite-burgundy/20 animate-in slide-in-from-top duration-300 bg-white/95 backdrop-blur-md rounded-lg mx-2">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className="text-elite-black font-cabin text-lg font-bold tracking-wider py-3 active:bg-elite-burgundy active:text-elite-white px-4 rounded-lg transition-all duration-300 active:scale-95 transform uppercase border-2 border-transparent active:border-elite-burgundy/20"
                >
                  Home
                </Link>
                <Link 
                  href="/menu" 
                  className="text-elite-black font-cabin text-lg font-bold tracking-wider py-3 active:bg-elite-burgundy active:text-elite-white px-4 rounded-lg transition-all duration-300 active:scale-95 transform uppercase border-2 border-transparent active:border-elite-burgundy/20"
                >
                  Menu
                </Link>
                <Link 
                  href="/rewards" 
                  className="text-elite-black font-cabin text-lg font-bold tracking-wider py-3 active:bg-elite-burgundy active:text-elite-white px-4 rounded-lg transition-all duration-300 active:scale-95 transform uppercase border-2 border-transparent active:border-elite-burgundy/20"
                >
                  Rewards
                </Link>
                <a 
                  href="#location" 
                  className="text-elite-black font-cabin text-lg font-bold tracking-wider py-3 active:bg-elite-burgundy active:text-elite-white px-4 rounded-lg transition-all duration-300 active:scale-95 transform uppercase border-2 border-transparent active:border-elite-burgundy/20"
                >
                  Location
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
