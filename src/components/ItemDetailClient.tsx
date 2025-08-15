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
    setSelectedSize('Medium'); // Set Medium as default selected size
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

  const hasMultipleSizes = () => {
    return item.sizes.length > 1;
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

  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-elite-cream">
      {/* Clean Header */}
      <div className="bg-elite-burgundy text-elite-cream py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/menu/${category.id}/${subCategory.id}`}
              className="inline-flex items-center gap-2 bg-elite-cream/20 text-elite-cream px-4 py-2 rounded-full font-cabin font-medium transition-all duration-300 hover:bg-elite-cream/30 hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to {subCategory.name}
            </Link>
            <div className="text-center">
              <h1 className="font-calistoga text-3xl font-bold">{item.name}</h1>
              <p className="font-cabin text-elite-cream/80 text-sm mt-1">{category.name} • {subCategory.name}</p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Image Section */}
          <div className="relative">
            <div className="aspect-square bg-elite-cream relative">
              
              {/* Circular Container */}
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
                <div className="absolute top-6 right-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-cabin font-bold shadow-lg z-30 flex items-center gap-1">
                  <Star className="w-4 h-4" />
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

          {/* Product Information */}
          <div className="space-y-8">
            {/* Title and Description */}
            <div>
              <h2 className="font-calistoga text-elite-burgundy text-4xl lg:text-5xl font-bold mb-4">
                {item.name}
              </h2>

              <p className="font-cabin text-elite-black/80 text-lg leading-relaxed mb-6">
                {item.description}
              </p>

              {/* Price Display */}
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <div className="text-center">
                  <div className="font-calistoga text-elite-burgundy text-3xl font-bold mb-2">
                    {totalPrice} EGP
                  </div>
                  {hasMultipleSizes() && (
                    <p className="font-cabin text-elite-black/60 text-sm">
                      Medium size shown
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Size Options - Only if multiple sizes exist */}
            {hasMultipleSizes() && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-calistoga text-elite-burgundy text-xl mb-4">
                  Choose Your Size
                </h3>
                
                                 <div className="grid grid-cols-3 gap-3">
                   {item.sizes.map((size) => {
                     const sizePrice = item.price + size.priceModifier;
                     return (
                       <button
                         key={size.name}
                         onClick={() => setSelectedSize(size.name)}
                         disabled={!size.available}
                         className={`p-4 rounded-xl font-cabin font-medium transition-all duration-300 text-center ${
                           selectedSize === size.name
                             ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                             : size.available
                             ? 'bg-elite-cream/50 text-elite-dark-burgundy/60 border border-elite-burgundy/10 cursor-not-allowed opacity-60'
                             : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
                         }`}
                       >
                         <div className={`font-bold text-sm ${
                           selectedSize === size.name
                             ? 'text-elite-cream'
                             : 'text-elite-dark-burgundy/60'
                         }`}>{size.name}</div>
                         <div className={`text-xs mt-1 ${
                           selectedSize === size.name
                             ? 'opacity-75 text-elite-cream'
                             : 'opacity-50 text-elite-dark-burgundy/50'
                         }`}>{sizePrice} EGP</div>
                       </button>
                     );
                   })}
                 </div>
              </div>
            )}

            {/* Flavor Options - Only if flavors exist */}
            {item.flavors.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-calistoga text-elite-burgundy text-xl mb-4">
                  Choose Your Flavor
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {item.flavors.map((flavor) => (
                    <button
                      key={flavor.name}
                      onClick={() => setSelectedFlavor(flavor.name)}
                      disabled={!flavor.available}
                      className={`p-4 rounded-xl font-cabin font-medium transition-all duration-300 text-center ${
                        selectedFlavor === flavor.name
                          ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                          : flavor.available
                          ? 'bg-elite-cream text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream border border-elite-burgundy/20'
                          : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-bold">{flavor.name}</div>
                      {flavor.price > 0 && (
                        <div className="text-sm opacity-75 mt-1">+{flavor.price} EGP</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topping Options - Only if toppings exist */}
            {item.toppings.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-calistoga text-elite-burgundy text-xl mb-4">
                  Add Toppings
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {item.toppings.map((topping) => (
                    <button
                      key={topping.name}
                      onClick={() => toggleTopping(topping.name)}
                      disabled={!topping.available}
                      className={`p-4 rounded-xl font-cabin font-medium transition-all duration-300 text-center ${
                        selectedToppings.includes(topping.name)
                          ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                          : topping.available
                          ? 'bg-elite-cream text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream border border-elite-burgundy/20'
                          : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-bold">{topping.name}</div>
                      {topping.price > 0 && (
                        <div className="text-sm opacity-75 mt-1">+{topping.price} EGP</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

                         {/* Allergen Note - Only if allergens exist */}
             {item.allergens.length > 0 && (
               <div className="bg-elite-cream/50 border border-elite-burgundy/20 rounded-2xl p-4">
                 <p className="font-cabin font-medium text-elite-dark-burgundy mb-1">
                   Contains: {item.allergens.join(', ')}
                 </p>
                 <p className="font-cabin text-elite-black/70 text-sm">
                   Let us know if you have any dietary preferences.
                 </p>
               </div>
             )}

                         {/* Add to Order Button - Commented out for now */}
             {/* <button
               disabled={!item.available}
               className={`w-full py-6 rounded-2xl font-cabin font-bold text-xl transition-all duration-300 border-2 ${
                 item.available
                   ? 'bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-dark-burgundy hover:scale-105 hover:shadow-xl shadow-lg border-elite-burgundy/30 hover:border-elite-burgundy/50'
                   : 'bg-elite-dark-cream text-elite-black/40 cursor-not-allowed border-elite-dark-cream/30'
               }`}
             >
               {item.available ? (
                 <div className="flex items-center justify-center gap-3">
                   <span>Add to Order</span>
                   <span className="text-lg">•</span>
                   <span>{totalPrice} EGP</span>
                 </div>
               ) : (
                 'Temporarily Unavailable'
               )}
             </button> */}
          </div>
        </div>

                 {/* Recommended Products */}
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
                   className="block"
                 >
                   <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:scale-105 group">
                     
                     <div className="relative aspect-square p-4 sm:p-6">
                       
                       {/* Image Container - Rounded with bottom-aligned drink */}
                       <div className="bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl sm:rounded-3xl transition-transform group-hover:scale-110 relative overflow-hidden h-68">
                         <div className="w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl flex items-end justify-center">
                           <img
                             src={recommendedItem.images[0]}
                             alt={recommendedItem.name}
                             className="w-full h-full object-cover object-bottom transition-opacity duration-300 opacity-100"
                             loading="lazy"
                           />
                         </div>
                       </div>
                     </div>
                     
                     {/* Enhanced Text with better spacing */}
                     <div className="text-center space-y-2 sm:space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                       <h4 className="font-calistoga text-elite-black font-bold text-xl sm:text-2xl lg:text-3xl leading-tight h-16 sm:h-20 flex items-center justify-center line-clamp-2">{recommendedItem.name}</h4>
                       <p className="font-cabin text-elite-burgundy font-bold text-xl sm:text-2xl lg:text-3xl pt-2">{recommendedItem.price} EGP</p>
                       {recommendedItem.description && (
                         <p className="font-cabin text-elite-black/70 text-sm leading-relaxed">{recommendedItem.description}</p>
                       )}
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