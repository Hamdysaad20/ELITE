"use client";

import { useState, useEffect } from 'react';

interface DrinkCardProps {
  image: string;
  name: string;
  price?: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  href?: string;
}

export default function DrinkCard({ 
  image, 
  name, 
  price, 
  description, 
  size = 'medium',
  className = '',
  href
}: DrinkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const sizeClasses = {
    small: {
      container: 'aspect-square',
      imageContainer: 'h-52'
    },
    medium: {
      container: 'aspect-square',
      imageContainer: 'h-60'
    },
    large: {
      container: 'aspect-square',
      imageContainer: 'h-68'
    }
  };

  const classes = sizeClasses[size];

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const CardContent = () => (
    <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:scale-105 group ${className}`}>
      
      <div className={`relative ${classes.container} p-4 sm:p-6`}>
        
        {/* Image Container - Rounded with bottom-aligned drink */}
        <div className={`bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl sm:rounded-3xl transition-transform group-hover:scale-110 relative overflow-hidden ${classes.imageContainer}`}>
          <div className="w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl flex items-end justify-center">
            {isClient && !imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-elite-dark-burgundy/20 z-10 rounded-2xl sm:rounded-3xl">
                <div className="text-elite-burgundy text-sm font-medium">Loading...</div>
              </div>
            )}
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-elite-dark-burgundy/20 rounded-2xl sm:rounded-3xl">
                <div className="text-elite-burgundy text-sm font-medium">Image not available</div>
              </div>
            ) : (
              <img
                src={image}
                alt={name}
                className={`w-full h-full object-cover object-bottom transition-opacity duration-300 ${
                  !isClient || imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Text with better spacing */}
      <div className="text-center space-y-2 sm:space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
        <h4 className="font-calistoga text-elite-black font-bold text-xl sm:text-2xl lg:text-3xl leading-tight h-16 sm:h-20 flex items-center justify-center line-clamp-2">{name}</h4>
        {price && <p className="font-cabin text-elite-burgundy font-bold text-xl sm:text-2xl lg:text-3xl pt-2">{price}</p>}
        {description && (
          <p className="font-cabin text-elite-black/70 text-sm leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );

  return href ? <a href={href} className="block"><CardContent /></a> : <CardContent />;
}
