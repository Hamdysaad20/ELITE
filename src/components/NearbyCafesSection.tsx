'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { MapPin, Clock, Navigation, MessageCircle } from 'lucide-react';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function NearbyCafesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Simple fade in for map image only
      gsap.set(mapRef.current, {
        opacity: 0,
        y: 20
      });
      
      gsap.to(mapRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
      return;
    }

    // Enhanced animations for map image only
    // Set initial states for map
    gsap.set(mapRef.current, {
      opacity: 0,
      scale: 0.8,
      rotationY: -15
    });

    // Create main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        toggleActions: "play none none none" // Only play once
      }
    });

    // Animate map with 3D effect
    tl.to(mapRef.current, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 1,
      ease: "power2.out"
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const cafe = {
    name: "Elite Cafee",
    address: "Faiyum, Governorate Club, next to the Governor's Villa",
    addressArabic: "الفيوم، نادي المحافظة، بجوار فيلا المحافظ",
    hours: "8 AM - 3 PM Daily"
  };

  const handleGetDirections = () => {
    // Open Google Maps with the exact Elite Cafee location URL
    const url = "https://www.google.com/maps/place/Elite+Cafee/@29.3190758,30.8404869,18.21z/data=!4m9!1m2!2m1!1s8R9R+QG4!3m5!1s0x14597900550ac2a3:0xdb13f17e857326d2!8m2!3d29.3193963!4d30.8413192!16s%2Fg%2F11xmm9t3xb?entry=ttu&g_ep=EgoyMDI1MDcxNi4wIKXMDSoASAFQAw%3D%3D";
    window.open(url, '_blank');
  };

  const handleContact = () => {
    // Open Facebook messenger or contact page
    window.open('https://facebook.com', '_blank');
  };

  return (
    <section ref={sectionRef} className="bg-elite-white relative py-20 lg:py-32">
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Modern Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="font-calistoga text-elite-black text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight mb-8">
            Find Your Way
            <br />
            <span className="text-elite-burgundy">to Elite</span>
          </h2>
          <p className="text-elite-black font-cabin text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            Located in the heart of Faiyum at the Governorate Club
          </p>
        </div>

        {/* Main Content - Modern Card Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">
          {/* Interactive Map Card */}
          <div 
            ref={mapRef}
            className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 h-[450px] lg:h-[500px] cursor-pointer transform hover:scale-[1.02]"
            onClick={handleGetDirections}
          >
            {/* Map Image */}
            <Image
              src="/images/location-map.png"
              alt="Elite Cafee location in Faiyum Governorate Club"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Location Card */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-elite-burgundy rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <MapPin className="w-6 h-6 text-elite-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-elite-black font-cabin font-bold text-lg">Elite Cafee</p>
                    <p className="text-elite-black/70 font-cabin text-sm">Tap to get directions</p>
                  </div>
                  <Navigation className="w-5 h-5 text-elite-black/60 group-hover:text-elite-black transition-colors duration-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Modern Info Card */}
          <div className="bg-elite-cream/80 backdrop-blur-md rounded-3xl p-8 lg:p-10 shadow-2xl border border-elite-burgundy/20 flex flex-col justify-center">
            <div className="space-y-8">
              {/* Café Name */}
              <div>
                <h3 className="text-elite-black font-calistoga text-4xl lg:text-5xl mb-2">
                  {cafe.name}
                </h3>
                <div className="w-20 h-1 bg-elite-burgundy rounded-full"></div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-6 h-6 text-elite-burgundy mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-elite-black font-cabin text-lg leading-relaxed">
                      {cafe.address}
                    </p>
                    <p className="text-elite-black font-cabin text-base leading-relaxed" dir="rtl">
                      {cafe.addressArabic}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-elite-burgundy flex-shrink-0" />
                <p className="text-elite-black font-cabin text-lg">
                  {cafe.hours}
                </p>
              </div>

              {/* CTA Button */}
              <button 
                onClick={handleGetDirections}
                className="group relative w-full bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-black font-cabin font-bold text-xl py-5 px-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden border-2 border-elite-burgundy/50 hover:border-elite-burgundy"
              >
                <span className="relative z-10 flex items-center justify-center space-x-3">
                  <Navigation className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:scale-105 transition-transform duration-300">Get Directions</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-elite-dark-burgundy to-elite-burgundy opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Modern Contact Section */}
        <div className="text-center">
          <div className="bg-elite-cream/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-elite-burgundy/20">
            <h3 className="font-calistoga text-elite-black text-3xl md:text-4xl lg:text-5xl leading-tight mb-6">
              Need Help Finding Us?
            </h3>
            <p className="text-elite-black font-cabin text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              We're here to help you find your way to the perfect cup of coffee
            </p>
            <button 
              onClick={handleContact}
              className="group inline-flex items-center space-x-3 bg-elite-burgundy text-elite-white font-cabin font-bold text-lg py-4 px-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Message us on Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 