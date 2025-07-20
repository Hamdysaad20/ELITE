import Link from 'next/link';
import { getCategoryById } from '@/lib/menuData';
import { ChevronLeft, ChevronRight, Coffee, Utensils, Home } from 'lucide-react';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAllCategories } from '@/lib/menuData';

export async function generateStaticParams() {
  const categories = getAllCategories();
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
                        className="block p-3 rounded-xl transition-all duration-300 bg-elite-cream text-elite-black hover:bg-elite-burgundy hover:text-elite-cream hover:shadow-lg"
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
            {category.comingSoon ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-xl p-12">
                  <div className="text-6xl mb-6">🏠</div>
                  <h2 className="font-calistoga text-elite-burgundy text-3xl mb-4">
                    Coming Soon!
                  </h2>
                  <p className="font-cabin text-elite-black text-lg mb-8">
                    We're working hard to bring you amazing {category.name.toLowerCase()} options. 
                    Stay tuned for updates!
                  </p>
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-semibold transition-all duration-300 hover:bg-elite-dark-burgundy hover:scale-105"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Menu
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-12">
                  <div className="text-center mb-8">
                    <div className="inline-block bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-3xl px-8 py-4 mb-4">
                      <h2 className="font-calistoga text-elite-burgundy text-3xl lg:text-4xl font-bold">
                        All {category.name}
                      </h2>
                    </div>
                    <p className="font-cabin text-elite-black/80 text-lg lg:text-xl max-w-2xl mx-auto">
                      Explore our complete selection of {category.name.toLowerCase()} crafted with passion and premium ingredients
                    </p>
                  </div>
                </div>

                {/* Subcategories Grid - Enhanced Modern Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {category.subCategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/menu/${category.id}/${sub.id}`}
                      className="group relative overflow-hidden bg-gradient-to-br from-white to-elite-cream/30 rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:shadow-elite-burgundy/30 border border-elite-cream/50"
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy/5 via-transparent to-elite-dark-burgundy/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Card Content */}
                      <div className="relative z-10 p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="font-calistoga text-elite-burgundy text-2xl lg:text-3xl font-bold mb-2">
                              {sub.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="bg-elite-burgundy/10 text-elite-burgundy px-3 py-1 rounded-full text-sm font-cabin font-semibold">
                                {sub.items.length} items
                              </span>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-elite-burgundy to-elite-dark-burgundy rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <ChevronRight className="w-6 h-6 text-elite-cream" />
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="font-cabin text-elite-black/80 text-base mb-6 leading-relaxed">
                          {sub.description}
                        </p>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-elite-cream/50">
                          <span className="font-cabin font-semibold text-elite-burgundy text-sm">
                            Explore Collection
                          </span>
                          <div className="flex items-center gap-2 text-elite-burgundy/60 group-hover:text-elite-burgundy transition-colors duration-300">
                            <span className="text-sm font-medium">View All</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Featured Items - Enhanced Modern Design */}
                {category.subCategories.some(sub => sub.items.some(item => item.featured)) && (
                  <div className="mt-16">
                    <div className="text-center mb-12">
                      <div className="inline-block bg-gradient-to-r from-elite-burgundy/10 to-elite-dark-burgundy/10 rounded-2xl px-6 py-3 mb-4">
                        <h3 className="font-calistoga text-elite-burgundy text-2xl lg:text-3xl font-bold">
                          Featured {category.name}
                        </h3>
                      </div>
                      <p className="font-cabin text-elite-black/80 text-lg">
                        Our most popular and beloved selections
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {category.subCategories
                        .flatMap(sub => sub.items)
                        .filter(item => item.featured)
                        .slice(0, 3)
                        .map((item) => (
                          <Link
                            key={item.id}
                            href={`/menu/${category.id}/${item.subCategory}/${item.id}`}
                            className="group relative overflow-hidden bg-gradient-to-br from-white to-elite-cream/20 rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:shadow-elite-burgundy/30 border border-elite-cream/50"
                          >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-elite-burgundy/5 via-transparent to-elite-dark-burgundy/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Image Section */}
                            <div className="relative h-56 bg-gradient-to-br from-elite-burgundy via-elite-dark-burgundy to-elite-burgundy flex items-center justify-center overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
                              <div className="relative z-10 w-20 h-20 bg-elite-cream/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Coffee className="w-10 h-10 text-elite-cream" />
                              </div>
                              {/* Featured Badge */}
                              <div className="absolute top-4 right-4 bg-elite-cream text-elite-burgundy px-3 py-1 rounded-full text-xs font-cabin font-bold shadow-lg">
                                Featured
                              </div>
                            </div>
                            
                            {/* Content Section */}
                            <div className="relative z-10 p-6">
                              <h4 className="font-calistoga text-elite-burgundy text-xl lg:text-2xl font-bold mb-3">
                                {item.name}
                              </h4>
                              <p className="font-cabin text-elite-black/80 text-sm mb-6 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                              
                              {/* Price and Action */}
                              <div className="flex items-center justify-between pt-4 border-t border-elite-cream/50">
                                <div className="flex items-center gap-2">
                                  <span className="font-cabin font-bold text-elite-burgundy text-lg">
                                    ${item.price.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-elite-burgundy/60 group-hover:text-elite-burgundy transition-colors duration-300">
                                  <span className="text-sm font-medium">View Details</span>
                                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
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