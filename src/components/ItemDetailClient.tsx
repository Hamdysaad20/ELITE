'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Coffee, Utensils, Home, ArrowRight } from 'lucide-react';
import { MenuItem, RecommendedItem, MenuCategory, SubCategory } from '@/lib/menuData';

interface ItemDetailClientProps {
  item: MenuItem;
  category: MenuCategory;
  subCategory: SubCategory;
  allCategories: MenuCategory[];
  recommendedItems: RecommendedItem[];
  recommendedItemsData: MenuItem[];
}

export default function ItemDetailClient({ 
  item, 
  category, 
  subCategory, 
  allCategories, 
  recommendedItems,
  recommendedItemsData 
}: ItemDetailClientProps) {
  // Initialize state with proper defaults to prevent hydration mismatches
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(subCategory.id);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
    
    // Reset state when component mounts to prevent stale state
    setCurrentImageIndex(0);
    setSelectedSize(null);
    setSelectedToppings([]);
    setSelectedFlavor(null);
    setActiveSubCategory(subCategory.id);
  }, [subCategory.id]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset state on unmount
      setCurrentImageIndex(0);
      setSelectedSize(null);
      setSelectedToppings([]);
      setSelectedFlavor(null);
    };
  }, []);

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'drinks':
        return <Coffee className="w-5 h-5" />;
      case 'food':
        return <Utensils className="w-5 h-5" />;
      case 'at home coffee':
        return <Home className="w-5 h-5" />;
      default:
        return <Coffee className="w-5 h-5" />;
    }
  };

  const calculateTotalPrice = () => {
    let total = item.price;
    
    // Add size modifier
    if (selectedSize) {
      const size = item.sizes.find(s => s.name === selectedSize);
      if (size) total += size.priceModifier;
    }
    
    // Add toppings
    selectedToppings.forEach(toppingName => {
      const topping = item.toppings.find(t => t.name === toppingName);
      if (topping) total += topping.price;
    });
    
    // Add flavor
    if (selectedFlavor) {
      const flavor = item.flavors.find(f => f.name === selectedFlavor);
      if (flavor) total += flavor.price;
    }
    
    return total;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  const toggleTopping = (toppingName: string) => {
    setSelectedToppings(prev => 
      prev.includes(toppingName) 
        ? prev.filter(t => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  // Don't render until client-side to prevent hydration issues
  if (!isClient) {
    return (
      <div className="min-h-screen bg-elite-cream flex items-center justify-center">
        <div className="text-elite-burgundy">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-elite-cream">
      {/* Simple Header */}
      <div className="bg-elite-burgundy text-elite-cream py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/menu/${category.id}/${subCategory.id}`}
              className="inline-flex items-center gap-2 bg-elite-cream/20 text-elite-cream px-4 py-2 rounded-full font-cabin font-medium transition-all duration-300 hover:bg-elite-cream/30 hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="text-center">
              <h1 className="font-calistoga text-2xl font-bold">{item.name}</h1>
              <p className="font-cabin text-elite-cream/80 text-sm">{category.name} • {subCategory.name}</p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Image Slider - Fixed */}
          <div className="relative">
            <div className="aspect-square bg-elite-cream relative">
              
              {/* Circular Container with Overflow Hidden - Like FindAndGet */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[28rem] h-[28rem] bg-elite-dark-burgundy rounded-full border border-elite-dark-burgundy/20 overflow-hidden z-10">
                <div className="w-full h-full p-8 pt-12">
                  <img
                    src={item.images[currentImageIndex]}
                    alt={item.name}
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />
                </div>
              </div>
              
              {/* Featured Badge */}
              {item.featured && (
                <div className="absolute top-6 right-6 bg-elite-burgundy text-elite-cream px-4 py-2 rounded-full text-sm font-cabin font-bold shadow-lg z-30">
                  <Star className="w-4 h-4 inline mr-1" />
                  Featured
                </div>
              )}
              
              {/* Navigation Arrows */}
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg z-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg z-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              {/* Image Indicators */}
              {item.images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-3 z-30">
                  {item.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-elite-burgundy scale-125' 
                          : 'bg-elite-burgundy/50 hover:bg-elite-burgundy/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Information - Simplified */}
          <div className="space-y-8">
            {/* Title and Price */}
            <div>
              <h2 className="font-calistoga text-elite-burgundy text-4xl lg:text-5xl font-bold mb-4">
                {item.name}
              </h2>

              <p className="font-cabin text-elite-black/80 text-lg leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Quick Customization - Only if options exist */}
            {(item.sizes.length > 0 || item.flavors.length > 0 || item.toppings.length > 0) && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-calistoga text-elite-burgundy text-xl mb-4">
                  Customize Your Drink
                </h3>
                
                {/* Size Options - Simplified */}
                {item.sizes.length > 0 && (
                  <div className="mb-6">
                    <p className="font-cabin font-semibold text-elite-black mb-3">Size</p>
                    <div className="flex gap-3">
                      {item.sizes.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size.name)}
                          disabled={!size.available}
                          className={`px-4 py-2 rounded-xl font-cabin font-medium transition-all duration-300 ${
                            selectedSize === size.name
                              ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                              : size.available
                              ? 'bg-elite-cream text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream'
                              : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
                          }`}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flavor Options - Simplified */}
                {item.flavors.length > 0 && (
                  <div className="mb-6">
                    <p className="font-cabin font-semibold text-elite-black mb-3">Flavor</p>
                    <div className="flex gap-3">
                      {item.flavors.map((flavor) => (
                        <button
                          key={flavor.name}
                          onClick={() => setSelectedFlavor(flavor.name)}
                          disabled={!flavor.available}
                          className={`px-4 py-2 rounded-xl font-cabin font-medium transition-all duration-300 ${
                            selectedFlavor === flavor.name
                              ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                              : flavor.available
                              ? 'bg-elite-cream text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream'
                              : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
                          }`}
                        >
                          {flavor.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topping Options - Simplified */}
                {item.toppings.length > 0 && (
                  <div>
                    <p className="font-cabin font-semibold text-elite-black mb-3">Toppings</p>
                    <div className="flex gap-3 flex-wrap">
                      {item.toppings.map((topping) => (
                        <button
                          key={topping.name}
                          onClick={() => toggleTopping(topping.name)}
                          disabled={!topping.available}
                          className={`px-4 py-2 rounded-xl font-cabin font-medium transition-all duration-300 ${
                            selectedToppings.includes(topping.name)
                              ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                              : topping.available
                              ? 'bg-elite-cream text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream'
                              : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
                          }`}
                        >
                          {topping.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Allergen Warning - Only if allergens exist */}
            {item.allergens.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="font-cabin font-semibold text-red-700 mb-2">⚠️ Contains: {item.allergens.join(', ')}</p>
                <p className="font-cabin text-red-600 text-sm">Please inform our team of any allergies before ordering.</p>
              </div>
            )}

            {/* Add to Order Button */}
            <button
              disabled={!item.available}
              className={`w-full py-4 rounded-2xl font-cabin font-bold text-xl transition-all duration-300 ${
                item.available
                  ? 'bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream hover:scale-105 hover:shadow-xl shadow-lg'
                  : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
              }`}
            >
              {item.available ? 'Add to Order' : 'Temporarily Unavailable'}
            </button>
          </div>
        </div>

        {/* Recommended Products - Simplified */}
        {recommendedItems.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="font-calistoga text-elite-burgundy text-3xl font-bold mb-2">
                You Might Also Like
              </h2>
              <p className="font-cabin text-elite-black/60">Discover more delicious options</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedItemsData.slice(0, 3).map((recommendedItem) => (
                <Link
                  key={recommendedItem.id}
                  href={`/menu/${recommendedItem.category}/${recommendedItem.subCategory}/${recommendedItem.id}`}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  {/* Item Image */}
                  <div className="h-48 bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center">
                    <Coffee className="w-12 h-12 text-elite-cream" />
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="font-calistoga text-elite-burgundy text-lg font-bold mb-2">
                      {recommendedItem.name}
                    </h3>
                    <p className="font-cabin text-elite-black/70 text-sm mb-3 line-clamp-2">
                      {recommendedItem.description}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="text-sm text-elite-black/50 group-hover:text-elite-burgundy transition-colors">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 