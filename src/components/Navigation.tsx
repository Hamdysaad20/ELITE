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
      <nav className="bg-brewhaus-green sticky top-0 z-50">
        {/* Desktop Navigation */}
        <div className="hidden md:block py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Left Nav Items */}
            <div className="flex items-center space-x-8">
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-4 py-2 rounded-full transition-all duration-300 font-cabin text-lg">
                Menu
              </a>
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-4 py-2 rounded-full transition-all duration-300 font-cabin text-lg">
                Locations
              </a>
            </div>

            {/* Center Logo */}
            <div className="flex items-center">
              <div className="w-12 h-12 bg-brewhaus-cream rounded-full flex items-center justify-center">
                <img
                  src="https://ext.same-assets.com/1022434225/3804416376.svg"
                  alt="Brewhaus Logo"
                  className="w-8 h-8"
                />
              </div>
            </div>

            {/* Right Nav Items */}
            <div className="flex items-center space-x-8">
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-4 py-2 rounded-full transition-all duration-300 font-cabin text-lg">
                About Us
              </a>
              <a href="#" className="text-brewhaus-cream hover:bg-brewhaus-cream hover:text-brewhaus-green px-4 py-2 rounded-full transition-all duration-300 font-cabin text-lg">
                News
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="w-10 h-10 bg-brewhaus-cream rounded-full flex items-center justify-center">
              <img
                src="https://ext.same-assets.com/1022434225/3804416376.svg"
                alt="Brewhaus Logo"
                className="w-6 h-6"
              />
            </div>

            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-brewhaus-cream"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-4 py-4 border-t border-brewhaus-cream/20">
              <div className="flex flex-col space-y-4">
                <a href="#" className="text-brewhaus-cream font-cabin text-lg py-2">
                  Menu
                </a>
                <a href="#" className="text-brewhaus-cream font-cabin text-lg py-2">
                  Locations
                </a>
                <a href="#" className="text-brewhaus-cream font-cabin text-lg py-2">
                  About Us
                </a>
                <a href="#" className="text-brewhaus-cream font-cabin text-lg py-2">
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
