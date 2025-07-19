'use client';

import { useState } from 'react';
import { X, Menu } from 'lucide-react';

export default function Navigation() {
  const [showPromo, setShowPromo] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Promotion Banner */}
      {showPromo && (
        <div className="bg-brewhaus-cream text-brewhaus-green text-center py-3 px-4 relative">
          <p className="font-cabin text-sm">
            Buy one coffee, get one free — this week only (April 14-20)
          </p>
          <button
            onClick={() => setShowPromo(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brewhaus-green hover:opacity-70 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="md:bg-transparent bg-brewhaus-green sticky top-0 z-50">
        {/* Desktop Navigation */}
        <div className="hidden md:block py-3 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-center">
            {/* Pilled Navigation Container */}
            <div className="bg-brewhaus-green rounded-full px-6 py-2 flex items-center space-x-6 shadow-lg">
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-3 py-1.5 rounded-full transition-all duration-300 font-cabin text-base font-medium">
                Menu
              </a>
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-3 py-1.5 rounded-full transition-all duration-300 font-cabin text-base font-medium">
                Locations
              </a>
              
              {/* Center Logo */}
              <div className="w-10 h-10 bg-brewhaus-cream rounded-full flex items-center justify-center shadow-md">
                <img
                  src="https://ext.same-assets.com/1022434225/3804416376.svg"
                  alt="Brewhaus Logo"
                  className="w-6 h-6"
                />
              </div>
              
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-3 py-1.5 rounded-full transition-all duration-300 font-cabin text-base font-medium">
                About Us
              </a>
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-3 py-1.5 rounded-full transition-all duration-300 font-cabin text-base font-medium">
                News
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="w-12 h-12 bg-brewhaus-cream rounded-full flex items-center justify-center shadow-md">
              <img
                src="https://ext.same-assets.com/1022434225/3804416376.svg"
                alt="Brewhaus Logo"
                className="w-7 h-7"
              />
            </div>

            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-12 h-12 bg-brewhaus-cream rounded-full flex items-center justify-center shadow-md"
            >
              {mobileMenuOpen ? <X size={24} className="text-brewhaus-green" /> : <Menu size={24} className="text-brewhaus-green" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-3 py-3 border-t border-brewhaus-cream/20">
              <div className="flex flex-col space-y-3">
                <a href="#" className="text-brewhaus-cream font-cabin text-base py-1.5">
                  Menu
                </a>
                <a href="#" className="text-brewhaus-cream font-cabin text-base py-1.5">
                  Locations
                </a>
                <a href="#" className="text-brewhaus-cream font-cabin text-base py-1.5">
                  About Us
                </a>
                <a href="#" className="text-brewhaus-cream font-cabin text-base py-1.5">
                  News
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
