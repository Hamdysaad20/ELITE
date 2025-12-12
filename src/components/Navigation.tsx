"use client";

import { useState, useEffect, useRef } from "react";
import { X, User, Settings, ShoppingBag, MapPin, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
  const [showPromo, setShowPromo] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

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

      {/* Main Navigation - Hidden on mobile */}
      <nav className="sticky top-0 z-50 hidden md:block">
        {/* Desktop Navigation */}
        <div>
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
                href="/deals"
                className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
              >
                <span className="text-base uppercase">
                  Deals
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

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                {status === "loading" ? (
                  <div className="w-12 h-12 rounded-full bg-elite-burgundy/20 animate-pulse flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-elite-burgundy/30 border-t-elite-burgundy rounded-full animate-spin" />
                  </div>
                ) : session ? (
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center text-elite-cream font-semibold text-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border-2 border-elite-cream shadow-lg overflow-hidden"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      session.user?.name?.charAt(0).toUpperCase() || "U"
                    )}
                  </button>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="text-elite-black hover:bg-elite-burgundy hover:text-elite-white px-6 py-4 rounded-full transition-all duration-300 font-cabin font-bold tracking-wider hover:scale-110 transform hover:shadow-xl hover:shadow-elite-burgundy/30 border-2 border-transparent hover:border-elite-burgundy/20"
                  >
                    <span className="text-base uppercase">Sign In</span>
                  </Link>
                )}

                {/* Dropdown Menu */}
                {profileDropdownOpen && session && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border-2 border-elite-burgundy/10 py-3 animate-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                    {/* Clickable Profile Photo & Info */}
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-elite-cream/50 transition-all duration-300 border-b border-elite-burgundy/10 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center text-elite-cream font-bold text-lg border-2 border-elite-cream shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 flex-shrink-0 overflow-hidden">
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || "Profile"}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            priority
                          />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full">
                            {session.user?.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-cabin font-bold text-elite-black truncate group-hover:text-elite-burgundy transition-colors duration-300">
                          {session.user?.name || "User"}
                        </p>
                        <p className="font-cabin text-sm text-elite-black/60 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                    </Link>

                    {/* Menu Items */}
                    <div className="py-3 px-3">
                      <Link
                        href="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-elite-cream rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md group"
                      >
                        <div className="w-10 h-10 rounded-full bg-elite-burgundy/10 flex items-center justify-center group-hover:bg-elite-burgundy/20 transition-colors duration-300">
                          <ShoppingBag className="w-5 h-5 text-elite-burgundy" />
                        </div>
                        <span className="font-cabin font-semibold text-elite-black">My Orders</span>
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-elite-cream rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md group"
                      >
                        <div className="w-10 h-10 rounded-full bg-elite-burgundy/10 flex items-center justify-center group-hover:bg-elite-burgundy/20 transition-colors duration-300">
                          <MapPin className="w-5 h-5 text-elite-burgundy" />
                        </div>
                        <span className="font-cabin font-semibold text-elite-black">Addresses</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-elite-cream rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md group"
                      >
                        <div className="w-10 h-10 rounded-full bg-elite-burgundy/10 flex items-center justify-center group-hover:bg-elite-burgundy/20 transition-colors duration-300">
                          <Settings className="w-5 h-5 text-elite-burgundy" />
                        </div>
                        <span className="font-cabin font-semibold text-elite-black">Settings</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-elite-burgundy/10 pt-3 px-3">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md w-full text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300">
                          <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="font-cabin font-semibold text-red-600">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
