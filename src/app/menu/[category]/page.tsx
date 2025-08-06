import Link from 'next/link';
import { getCategoryById } from '@/lib/menuData';
import { ChevronLeft, ChevronRight, Coffee, Utensils, Home } from 'lucide-react';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAllCategories } from '@/lib/menuData';
import DrinkCard from '@/components/DrinkCard';

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
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto sidebar-scroll">
              {/* Sidebar Header */}
              <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
                <h2 className="font-calistoga text-elite-burgundy text-xl font-bold mb-1">
                  Categories
                </h2>
                <p className="font-cabin text-elite-black/70 text-xs">
                  Navigate through our menu
                </p>
              </div>
              
              {/* Main Categories */}
              <div className="space-y-1 mb-6">
                {allCategories.map((cat, index) => (
                  <div key={cat.id}>
                    <Link
                      href={cat.comingSoon ? '#' : `/menu/${cat.id}`}
                      className={`group sidebar-item flex items-center justify-between p-3 rounded-xl transition-all duration-300 border ${
                        cat.id === categoryId
                          ? 'bg-elite-burgundy text-elite-cream shadow-lg border-elite-burgundy'
                          : cat.comingSoon
                          ? 'bg-elite-dark-cream text-elite-black/50 cursor-not-allowed border-elite-dark-cream'
                          : 'bg-white text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg hover:scale-102 border-elite-burgundy/20 hover:border-elite-burgundy'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          cat.id === categoryId 
                            ? 'bg-elite-cream' 
                            : cat.comingSoon 
                            ? 'bg-elite-black/20' 
                            : 'bg-elite-burgundy group-hover:bg-elite-cream'
                        }`}></div>
                        <span className="font-cabin font-medium text-sm">{cat.name}</span>
                      </div>
                      {cat.comingSoon && (
                        <span className="text-xs bg-elite-burgundy/40 text-elite-cream/90 px-2 py-0.5 rounded-full font-medium">
                          Soon
                        </span>
                      )}
                    </Link>
                    {index < allCategories.length - 1 && (
                      <div className="h-px bg-elite-burgundy/10 my-3"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-elite-burgundy/20">
                <div className="text-center">
                  <p className="font-cabin text-elite-black/40 text-xs">
                    Fresh ingredients daily
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Content - REFACTORED */}
          <div className="flex-1">
            {/* Subcategories with Items - EXPANDED VIEW */}
            <div className="space-y-12">
              {category.subCategories.map((sub, index) => (
                <div key={sub.id} className="relative">
                  <div className="bg-elite-cream rounded-2xl shadow-md p-8 border border-elite-burgundy/10">
                  {/* Subcategory Header */}
                  <div className="mb-8">
                    <h3 className="font-calistoga text-elite-black text-3xl font-bold mb-3">
                      {sub.name}
                    </h3>
                    <p className="font-cabin text-elite-black/90 text-lg">
                      {sub.description}
                    </p>
                  </div>

                  {/* Items List - Enhanced Grid with Circular Base Effect */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {sub.items.map((item) => (
                      <DrinkCard
                        key={item.id}
                        image={item.images[0]}
                        name={item.name}
                        price={`${item.price} EGP`}
                        description={item.description}
                        size="medium"
                        href={`/menu/${category.id}/${sub.id}/${item.id}`}
                      />
                    ))}
                  </div>
                </div>
                  {index < category.subCategories.length - 1 && (
                    <div className="h-px bg-elite-burgundy/10 mt-12"></div>
                  )}
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
