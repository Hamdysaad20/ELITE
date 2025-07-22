'use client';

import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const [showPromo, setShowPromo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle hash navigation when page loads
  useEffect(() => {
    if (pathname === '/' && window.location.hash === '#location') {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        const locationElement = document.getElementById('location');
        if (locationElement) {
          locationElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Handle location navigation
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (pathname === '/') {
      // If already on home page, just scroll to location
      const locationElement = document.getElementById('location');
      if (locationElement) {
        locationElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on another page, navigate to home and then scroll to location
      router.push('/#location');
    }
  };

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
                href="/menu" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Menu
                </span>
              </Link>
              <a 
                href="#location" 
                onClick={handleLocationClick}
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Location
                </span>
              </a>
              
              {/* Center Logo */}
              <Link href="/" className={`rounded-lg flex items-center justify-center px-10 transition-all duration-500 ease-in-out hover:scale-105 ${
                isScrolled ? 'h-20 -my-3' : 'h-32 -my-8'
              }`}>
                <img
                  src="/images/logo_noBG.png"
                  alt="Elite Coffee Logo"
                  className={`w-auto object-contain transition-all duration-500 ease-in-out ${
                    isScrolled ? 'h-16' : 'h-24'
                  }`}
                />
              </Link>
              
              <Link 
                href="/rewards" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20 relative"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Rewards
                </span>
                <span className="absolute -top-2 -right-2 bg-elite-burgundy text-elite-cream text-xs px-2 py-1 rounded-full font-bold">
                  Soon
                </span>
              </Link>
              <Link 
                href="/shop" 
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20 relative"
              >
                <span className={`transition-all duration-300 uppercase ${isScrolled ? 'text-base' : 'text-lg'}`}>
                  Shop
                </span>
                <span className="absolute -top-2 -right-2 bg-elite-burgundy text-elite-cream text-xs px-2 py-1 rounded-full font-bold">
                  Soon
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden bg-elite-cream transition-all duration-500 ease-in-out ${
          isScrolled ? 'py-3 px-4' : 'py-6 px-6'
        }`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className={`rounded-lg flex items-center justify-center px-4 transition-all duration-500 ease-in-out hover:scale-105 ${
              isScrolled ? 'h-16 -my-2' : 'h-20 -my-3'
            }`}>
              <img
                src="/images/logo_noBG.png"
                alt="Elite Coffee Logo"
                className={`w-auto object-contain transition-all duration-500 ease-in-out ${
                  isScrolled ? 'h-12' : 'h-16'
                }`}
              />
            </Link>

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
            <div className="mt-4 py-4 border-t border-elite-burgundy/20 bg-white rounded-lg mx-2">
              <div className="flex flex-col space-y-2 px-4">
                <Link 
                  href="/menu" 
                  className="text-elite-black font-cabin text-base font-semibold py-3 px-4 rounded-lg transition-colors duration-200 hover:bg-elite-burgundy hover:text-elite-cream"
                >
                  Menu
                </Link>
                <a 
                  href="#location" 
                  onClick={handleLocationClick}
                  className="text-elite-black font-cabin text-base font-semibold py-3 px-4 rounded-lg transition-colors duration-200 hover:bg-elite-burgundy hover:text-elite-cream"
                >
                  Location
                </a>
                <Link 
                  href="/rewards" 
                  className="text-elite-black font-cabin text-base font-semibold py-3 px-4 rounded-lg transition-colors duration-200 hover:bg-elite-burgundy hover:text-elite-cream relative"
                >
                  Rewards
                  <span className="absolute -top-1 -right-1 bg-elite-burgundy text-elite-cream text-xs px-1.5 py-0.5 rounded-full font-bold">
                    Soon
                  </span>
                </Link>
                <Link 
                  href="/shop" 
                  className="text-elite-black font-cabin text-base font-semibold py-3 px-4 rounded-lg transition-colors duration-200 hover:bg-elite-burgundy hover:text-elite-cream relative"
                >
                  Shop
                  <span className="absolute -top-1 -right-1 bg-elite-burgundy text-elite-cream text-xs px-1.5 py-0.5 rounded-full font-bold">
                    Soon
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
