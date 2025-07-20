import Link from 'next/link';
import { getCategoryById, getSubCategoryById } from '@/lib/menuData';
import { ChevronLeft, ChevronRight, Coffee, Star, Utensils, Home } from 'lucide-react';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAllCategories } from '@/lib/menuData';

export async function generateStaticParams() {
  const categories = getAllCategories();
  const params = [];
  
  for (const category of categories) {
    for (const subCategory of category.subCategories) {
      params.push({
        category: category.id,
        subcategory: subCategory.id,
      });
    }
  }
  
  return params;
}

export default async function SubCategoryPage({ params }: { params: Promise<{ category: string; subcategory: string }> }) {
  const { category: categoryId, subcategory: subCategoryId } = await params;
  
  const category = getCategoryById(categoryId);
  const subCategory = getSubCategoryById(categoryId, subCategoryId);
  const allCategories = getAllCategories();

  if (!category || !subCategory) {
    notFound();
  }

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

  return (
    <main>
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
      {/* Header */}
      <div className="bg-elite-burgundy text-elite-cream py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link 
              href="/menu" 
              className="hover:text-elite-light-cream transition-colors duration-200"
            >
              Menu
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              href={`/menu/${category.id}`}
              className="hover:text-elite-light-cream transition-colors duration-200"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold">{subCategory.name}</span>
          </div>

          {/* Subcategory Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">
              {getCategoryIcon(category.name)}
            </div>
            <div>
              <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                {subCategory.name}
              </h1>
              <p className="font-cabin text-elite-cream/90 text-lg">
                {subCategory.description}
              </p>
            </div>
          </div>

          {/* Back Button */}
          <Link
            href={`/menu/${category.id}`}
            className="inline-flex items-center gap-2 bg-elite-cream text-elite-burgundy px-6 py-3 rounded-full font-cabin font-semibold transition-all duration-300 hover:bg-elite-light-cream hover:scale-105"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {category.name}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side Navigation */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="font-calistoga text-elite-burgundy text-2xl mb-6">
                Categories
              </h2>
              
              {/* Main Categories */}
              <div className="space-y-4 mb-8">
                {allCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.comingSoon ? '#' : `/menu/${cat.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      cat.id === categoryId
                        ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                        : cat.comingSoon
                        ? 'bg-elite-dark-cream text-elite-black/60 cursor-not-allowed'
                        : 'bg-elite-cream text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-cabin font-semibold">{cat.name}</span>
                    {cat.comingSoon && (
                      <span className="ml-auto text-xs bg-elite-burgundy text-elite-cream px-2 py-1 rounded-full">
                        Soon
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Subcategories */}
              {!category.comingSoon && category.subCategories.length > 0 && (
                <div>
                  <h3 className="font-calistoga text-elite-burgundy text-xl mb-4">
                    {category.name} Types
                  </h3>
                  <div className="space-y-2">
                    {category.subCategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/menu/${category.id}/${sub.id}`}
                        className={`block p-3 rounded-xl transition-all duration-300 ${
                          subCategoryId === sub.id
                            ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                            : 'bg-elite-cream text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-cabin font-semibold">{sub.name}</span>
                          <span className="text-sm opacity-75">
                            {sub.items.length} items
                          </span>
                        </div>
                        <p className="text-sm opacity-75 mt-1">
                          {sub.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Content */}
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="font-calistoga text-elite-burgundy text-3xl mb-4">
                {subCategory.name}
              </h2>
              <p className="font-cabin text-elite-black text-lg mb-6">
                {subCategory.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-elite-black/60">
                <span>{subCategory.items.length} items available</span>
                <span>•</span>
                <span>All items are made fresh daily</span>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subCategory.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${category.id}/${subCategory.id}/${item.id}`}
                  className="group bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-elite-burgundy/20"
                >
                  {/* Item Image */}
                  <div className="h-48 bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy flex items-center justify-center relative overflow-hidden">
                    <Coffee className="w-16 h-16 text-elite-cream" />
                    {item.featured && (
                      <div className="absolute top-3 right-3 bg-elite-cream text-elite-burgundy px-2 py-1 rounded-full text-xs font-cabin font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </div>
                    )}
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-elite-cream font-cabin font-semibold">
                          Temporarily Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-calistoga text-elite-burgundy text-xl leading-tight">
                        {item.name}
                      </h3>
                      <span className="font-cabin font-bold text-elite-burgundy text-lg">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="font-cabin text-elite-black/80 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Item Features */}
                    <div className="space-y-2 mb-4">
                      {item.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.sizes.slice(0, 2).map((size) => (
                            <span 
                              key={size.name}
                              className="bg-elite-cream text-elite-burgundy text-xs px-2 py-1 rounded-full font-cabin"
                            >
                              {size.name}
                            </span>
                          ))}
                          {item.sizes.length > 2 && (
                            <span className="bg-elite-cream text-elite-burgundy text-xs px-2 py-1 rounded-full font-cabin">
                              +{item.sizes.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {item.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.slice(0, 2).map((allergen) => (
                            <span 
                              key={allergen}
                              className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-cabin"
                            >
                              {allergen}
                            </span>
                          ))}
                          {item.allergens.length > 2 && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-cabin">
                              +{item.allergens.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-elite-black/60 group-hover:text-elite-burgundy transition-colors">
                        View Details →
                      </span>
                      {!item.available && (
                        <span className="text-sm text-red-600 font-cabin font-semibold">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {subCategory.items.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-xl p-12">
                  <div className="text-6xl mb-6">☕</div>
                  <h3 className="font-calistoga text-elite-burgundy text-2xl mb-4">
                    No Items Available
                  </h3>
                  <p className="font-cabin text-elite-black text-lg mb-8">
                    We're currently updating our {subCategory.name.toLowerCase()} selection. 
                    Please check back soon!
                  </p>
                  <Link
                    href={`/menu/${category.id}`}
                    className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-semibold transition-all duration-300 hover:bg-elite-dark-burgundy hover:scale-105"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to {category.name}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
} 