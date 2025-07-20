'use client';

import { useState } from 'react';
import { Coffee, Utensils } from 'lucide-react';

interface MenuImageProps {
  src: string;
  alt: string;
  category: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function MenuImage({ 
  src, 
  alt, 
  category, 
  className = "", 
  fallbackIcon 
}: MenuImageProps) {
  const [imageError, setImageError] = useState(false);

  const getDefaultIcon = () => {
    if (fallbackIcon) return fallbackIcon;
    
    switch (category.toLowerCase()) {
      case 'drinks':
        return <Coffee className="w-16 h-16 text-elite-cream" />;
      case 'food':
        return <Utensils className="w-16 h-16 text-elite-cream" />;
      default:
        return <Coffee className="w-16 h-16 text-elite-cream" />;
    }
  };

  if (imageError || !src) {
    return (
      <div className={`bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center ${className}`}>
        {getDefaultIcon()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
} 