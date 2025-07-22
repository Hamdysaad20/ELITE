import Link from 'next/link';
import { getCategoryById } from '@/lib/menuData';
import { ChevronLeft, ChevronRight, Coffee, Utensils, Home } from 'lucide-react';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAllCategories } from '@/lib/menuData';

/**
 * Generate static params for all menu categories
 * This ensures all category pages are pre-built at build time
 * Following Next.js best practices for static exports
 */
export async function generateStaticParams() {
  const categories = getAllCategories();
  
  // Return all category IDs as static params
  // This ensures all category pages are generated at build time
  return categories.map((category) => ({
    category: category.id,
  }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);
  const allCategories = getAllCategories();

  if (!category) {
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
            <span className="font-semibold">{category.name}</span>
          </div>

          {/* Category Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">
              {getCategoryIcon(category.name)}
            </div>
            <div>
              <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                {category.name}
              </h1>
              <p className="font-cabin text-elite-cream/90 text-lg">
                {category.description}
              </p>
            </div>
          </div>

          {/* Back to Menu Button */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-elite-cream text-elite-burgundy px-6 py-3 rounded-full font-cabin font-semibold transition-all duration-300 hover:bg-elite-light-cream hover:scale-105"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
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
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                      cat.id === categoryId
                        ? 'bg-elite-burgundy text-elite-cream shadow-lg'
                        : cat.comingSoon
                        ? 'bg-elite-dark-cream text-elite-black/60 cursor-not-allowed'
                        : 'bg-elite-cream text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg'
                    }`}
                  >
                    <span className="font-cabin font-semibold">{cat.name}</span>
                    {cat.comingSoon && (
                      <span className="text-xs bg-elite-burgundy text-elite-cream px-2 py-1 rounded-full">
                        Soon
                      </span>
                    )}
                  </Link>
                ))}
              </div>

            </div>
          </div>

          {/* Right Side Content - REFACTORED */}
          <div className="flex-1">
            <div className="mb-12">
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-3xl px-8 py-4 mb-4">
                  <h2 className="font-calistoga text-elite-black text-4xl lg:text-5xl font-bold">
                    {category.name}
                  </h2>
                </div>
                <p className="font-cabin text-elite-black/90 text-lg lg:text-xl max-w-2xl mx-auto">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Subcategories with Items - EXPANDED VIEW */}
            <div className="space-y-12">
              {category.subCategories.map((sub) => (
                <div key={sub.id} className="bg-elite-cream rounded-2xl shadow-md p-8 border border-elite-burgundy/10">
                  {/* Subcategory Header */}
                  <div className="mb-8">
                    <h3 className="font-calistoga text-elite-black text-3xl font-bold mb-3">
                      {sub.name}
                    </h3>
                    <p className="font-cabin text-elite-black/90 text-lg">
                      {sub.description}
                    </p>
                  </div>

                  {/* Items List - Enhanced Grid with Bigger Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {sub.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/menu/${category.id}/${sub.id}/${item.id}`}
                        className="group flex flex-col items-center p-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/50 cursor-pointer"
                      >
                        {/* Enhanced Product Image - Much Bigger */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-6">
                          {/* Background Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy via-elite-dark-burgundy to-elite-burgundy rounded-full shadow-xl group-hover:shadow-2xl transition-all duration-300"></div>
                          
                          {/* Inner Glow Effect */}
                          <div className="absolute inset-3 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                          
                          {/* Product Icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Coffee className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-elite-cream drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          
                          {/* Hover Ring Effect */}
                          <div className="absolute inset-0 rounded-full border-3 border-transparent group-hover:border-elite-burgundy/40 transition-all duration-300"></div>
                        </div>
                        
                        {/* Item Name */}
                        <h4 className="font-cabin text-elite-black text-sm md:text-base font-semibold text-center leading-tight group-hover:text-elite-burgundy transition-colors duration-300">
                          {item.name}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
} 