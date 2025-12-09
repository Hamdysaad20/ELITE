"use client";

import { useState, useEffect } from "react";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
  const [showPromo, setShowPromo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Handle hash navigation when page loads
  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#location") {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        const locationElement = document.getElementById("location");
        if (locationElement) {
          locationElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Handle location navigation
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (pathname === "/") {
      // If already on home page, just scroll to location
      const locationElement = document.getElementById("location");
      if (locationElement) {
        locationElement.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If on another page, navigate to home and then scroll to location
      router.push("/#location");
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
      <nav className="sticky top-0 z-50">
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-center py-3 px-6">
            {/* Pilled Navigation Container */}
            <div className="bg-elite-cream rounded-full flex items-center space-x-10 shadow-2xl px-10 py-4">
              <Link
                href="/menu"
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className="text-base uppercase">
                  Menu
                </span>
              </Link>
              <a
                href="#location"
                onClick={handleLocationClick}
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className="text-base uppercase">
                  Location
                </span>
              </a>

              {/* Center Logo */}
              <Link
                href="/"
                className="rounded-lg flex items-center justify-center px-10 h-20 -my-3 hover:scale-105 transition-transform duration-300"
              >
                <img
                  src="/images/logo_noBG.png"
                  alt="Elite Coffee Logo - Navigate to Home"
                  className="w-auto h-16 object-contain"
                />
              </Link>

              <Link
                href="/order"
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className="text-base uppercase">
                  Order
                </span>
              </Link>
              <Link
                href="/rewards"
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className="text-base uppercase">
                  Rewards
                </span>
              </Link>
              <Link
                href="/suggest"
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20 relative"
              >
                <span className="text-base uppercase">
                  AI Suggest
                </span>
              </Link>
              <Link
                href="/shop"
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20 relative"
              >
                <span className="text-base uppercase">
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
        <div className="md:hidden py-3 px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="rounded-lg flex items-center justify-center px-4 h-16 -my-2 hover:scale-105 transition-transform duration-300"
            >
              <img
                src="/images/logo_noBG.png"
                alt="Elite Coffee Logo - Navigate to Home"
                className="w-auto h-12 object-contain"
              />
            </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-elite-cream rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 border-2 border-elite-burgundy/20 w-10 h-10"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-elite-black" />
              ) : (
                <Menu size={20} className="text-elite-black" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-4 py-6 border-t border-elite-burgundy/20 bg-elite-cream rounded-lg mx-2">
              <div className="flex flex-col space-y-3 px-4">
                <Link
                  href="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105"
                >
                  Menu
                </Link>
                <a
                  href="#location"
                  onClick={(e) => {
                    handleLocationClick(e);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105"
                >
                  Location
                </a>
                <Link
                  href="/order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105 relative"
                >
                  Order
                </Link>
                <Link
                  href="/rewards"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105 relative"
                >
                  Rewards
                </Link>
                <Link
                  href="/suggest"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105 relative"
                >
                  AI Suggest
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-elite-black font-cabin text-base font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-105 relative"
                >
                  Shop
                  <span className="absolute -top-2 -right-2 bg-elite-burgundy text-elite-cream text-xs px-2 py-1 rounded-full font-bold">
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
