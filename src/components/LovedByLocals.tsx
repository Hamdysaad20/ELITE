'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function LovedByLocals() {
  const productRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const products = [
    {
      name: "Cappuccino",
      image: "https://ext.same-assets.com/1022434225/2347648118.avif",
      link: "/menu/classic-drinks"
    },
    {
      name: "Bubble Tea",
      image: "https://ext.same-assets.com/1022434225/4278114908.avif",
      link: "/menu/special-drinks"
    },
    {
      name: "Iced Tea",
      image: "https://ext.same-assets.com/1022434225/703059297.avif",
      link: "/menu/special-drinks"
    },
    {
      name: "Iced Latte",
      image: "https://ext.same-assets.com/1022434225/1157300862.avif",
      link: "/menu/special-drinks"
    }
  ];

  useEffect(() => {
    // Set initial state - scale down to 0
    gsap.set([...productRefs.current, buttonRef.current], {
      scale: 0,
      opacity: 0
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: productRefs.current[0],
        start: "top 90%",
        end: "bottom 10%",
        toggleActions: "play none none none"
      }
    });

    // Animate products in sequence
    tl.to(productRefs.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)",
      stagger: 0.2
    })
    // Animate button last
    .to(buttonRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.4");
  }, []);

  return (
    <section className="bg-elite-cream py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-elite-black text-5xl md:text-6xl lg:text-7xl mb-6">
          Loved by Locals
        </h2>

        {/* Subtext */}
        <p className="text-elite-black font-cabin text-xl md:text-2xl mb-16 max-w-2xl mx-auto">
          Local go-to's everyone loves — handpicked and always fresh.
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {products.map((product, index) => (
            <a
              key={index}
              href={product.link}
              className="group cursor-pointer flex flex-col items-center"
              ref={(el) => {
                productRefs.current[index] = el;
              }}
            >
              <div className="bg-elite-burgundy rounded-3xl  transition-transform group-hover:scale-105 mb-4 relative overflow-hidden">
                <div className="aspect-square overflow-hidden rounded-2xl flex items-end">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-bottom"
                  />
                </div>
              </div>
              <div className="text-center w-full">
                <h3 className="font-calistoga text-elite-black text-2xl">
                  {product.name}
                </h3>
              </div>
            </a>
          ))}
        </div>

        {/* Explore Menu Button */}
        <button ref={buttonRef} className="bg-elite-burgundy text-elite-white px-6 py-3 rounded-full font-cabin text-base font-semibold hover:opacity-90 transition-opacity">
          Explore Menu
        </button>
      </div>
    </section>
  );
}
