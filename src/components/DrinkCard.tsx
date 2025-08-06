"use client";

import { useState } from 'react';

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

  const sizeClasses = {
    small: {
      container: 'h-72',
      circle: 'w-56 h-56',
      image: 'w-48 h-64'
    },
    medium: {
      container: 'h-80',
      circle: 'w-64 h-64',
      image: 'w-56 h-72'
    },
    large: {
      container: 'h-88',
      circle: 'w-72 h-72', 
      image: 'w-64 h-80'
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
    <div className={`bg-elite-cream transition-all duration-300 transform hover:-translate-y-2 p-3 group ${className}`}>
      
      <div className={`relative ${classes.container} mb-4`}>
        
        {/* Circular Container with Overflow Hidden - Like FindAndGet */}
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 ${classes.circle} bg-elite-dark-burgundy rounded-full border border-elite-dark-burgundy/20 overflow-hidden z-10`}>
          <div className="w-full h-full p-6 pt-8 relative">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-elite-dark-burgundy">
                <div className="text-elite-cream text-sm">Loading...</div>
              </div>
            )}
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-elite-dark-burgundy">
                <div className="text-elite-cream text-sm">Image not available</div>
              </div>
            ) : (
              <img
                src={image}
                alt={name}
                className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Text */}
      <div className="text-center space-y-2">
        <h4 className="font-calistoga text-elite-black font-bold text-xl lg:text-2xl leading-tight">{name}</h4>
        {price && <p className="font-cabin text-elite-burgundy font-bold text-2xl lg:text-3xl">{price}</p>}
      </div>
    </div>
  );

  return href ? <a href={href} className="block"><CardContent /></a> : <CardContent />;
} 