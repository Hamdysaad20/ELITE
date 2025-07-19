'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function NearbyCafesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const cafesRef = useRef<HTMLDivElement>(null);
  const cafeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Simple fade in for users who prefer reduced motion
      gsap.set([headingRef.current, subtitleRef.current, contentRef.current], {
        opacity: 0,
        y: 20
      });
      
      gsap.to([headingRef.current, subtitleRef.current, contentRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
      return;
    }

    // Enhanced animations for users who don't prefer reduced motion
    // Set initial states
    gsap.set(headingRef.current, {
      opacity: 0,
      y: 30,
      scale: 0.95
    });
    
    gsap.set(subtitleRef.current, {
      opacity: 0,
      y: 20
    });
    
    gsap.set(mapRef.current, {
      opacity: 0,
      scale: 0.9,
      rotationY: -10
    });
    
    gsap.set(cafeRefs.current, {
      opacity: 0,
      y: 30,
      scale: 0.9
    });

    // Create main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    // Animate heading with bounce effect
    tl.to(headingRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    })
    // Animate subtitle
    .to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4")
    // Animate map
    .to(mapRef.current, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.3")
    // Animate cafes with stagger
    .to(cafeRefs.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.out(1.4)"
    }, "-=0.2");

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const cafes = [
    {
      borough: "Brooklyn",
      address: "123 Bedford Ave, Brooklyn, NY 11211",
      hours: "7AM - 7PM"
    },
    {
      borough: "Manhattan",
      address: "456 Spring St, New York, NY 10012",
      hours: "7AM - 8PM"
    },
    {
      borough: "Queens",
      address: "789 Broadway, Queens, NY 11106",
      hours: "7AM - 6PM"
    },
    {
      borough: "Queens",
      address: "134-16 36th Road, Flushing, NY 11354",
      hours: "8AM - 6PM"
    }
  ];

  return (
    <section ref={sectionRef} className="bg-brewhaus-green relative overflow-hidden py-12 lg:py-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-brewhaus-cream rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 
            ref={headingRef} 
            className="font-calistoga text-brewhaus-cream text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-6"
          >
            Nearby
            <br />
            <span className="text-brewhaus-light-green">Cafés</span>
          </h2>
          <p 
            ref={subtitleRef} 
            className="text-brewhaus-cream font-cabin text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
          >
            Find a Brewhaus nearby and stop in for your favorite drink
          </p>
        </div>

        {/* Main Content */}
        <div ref={contentRef} className="bg-brewhaus-cream rounded-3xl p-8 lg:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Map */}
            <div 
              ref={mapRef}
              className="relative group rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 h-[400px] lg:h-[500px]"
            >
              {/* Placeholder for map - you can replace with actual map component */}
              <div className="w-full h-full bg-gradient-to-br from-brewhaus-green/20 to-brewhaus-light-green/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-brewhaus-green font-cabin font-semibold text-lg">Interactive Map</p>
                  <p className="text-brewhaus-green/70 font-cabin text-sm">Coming Soon</p>
                </div>
              </div>
              
              {/* Map pins overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-brewhaus-green rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-brewhaus-green rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-brewhaus-green rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-brewhaus-green rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-brewhaus-green rounded-full border-2 border-white shadow-lg"></div>
              </div>
            </div>

            {/* Right Column - Café Listings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {cafes.map((cafe, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cafeRefs.current[idx] = el; }}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-brewhaus-green/10 hover:border-brewhaus-green/30"
                >
                  <h3 className="text-brewhaus-green font-cabin font-bold text-lg mb-2">
                    {cafe.borough}
                  </h3>
                  <p className="text-brewhaus-green/70 font-cabin text-sm mb-3 leading-relaxed">
                    {cafe.address}
                  </p>
                  <p className="text-brewhaus-green/60 font-cabin text-xs mb-4">
                    Open daily: {cafe.hours}
                  </p>
                  <button className="w-full bg-brewhaus-green text-white font-cabin font-semibold text-sm py-2 px-4 rounded-xl hover:bg-brewhaus-light-green transition-colors duration-300">
                    Get Directions
                  </button>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brewhaus-light-green/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12 lg:mt-16">
          <h3 className="font-calistoga text-brewhaus-cream text-2xl md:text-3xl lg:text-4xl leading-tight mb-8">
            Need Help?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-brewhaus-cream text-brewhaus-green font-cabin font-semibold text-base py-3 px-6 rounded-full hover:bg-white transition-colors duration-300 shadow-lg hover:shadow-xl">
              Message us on Facebook
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 