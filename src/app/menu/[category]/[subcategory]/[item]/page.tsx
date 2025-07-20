import { getCategoryById, getSubCategoryById, getItemById, getRecommendedItems, getAllCategories, MenuItem } from '@/lib/menuData';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ItemDetailClient from '@/components/ItemDetailClient';

export async function generateStaticParams() {
  const categories = getAllCategories();
  const params = [];
  
  for (const category of categories) {
    for (const subCategory of category.subCategories) {
      for (const item of subCategory.items) {
        params.push({
          category: category.id,
          subcategory: subCategory.id,
          item: item.id,
        });
      }
    }
  }
  
  return params;
}

export default async function ItemDetailPage({ params }: { params: Promise<{ category: string; subcategory: string; item: string }> }) {
  const { category: categoryId, subcategory: subCategoryId, item: itemId } = await params;
  
  const category = getCategoryById(categoryId);
  const subCategory = getSubCategoryById(categoryId, subCategoryId);
  const item = getItemById(itemId);
  const allCategories = getAllCategories();

  if (!category || !subCategory || !item) {
    notFound();
  }

  const recommendedItems = getRecommendedItems(item);
  
  // Get the actual recommended items data
  const recommendedItemsData = recommendedItems
    .map(rec => getItemById(rec.itemId))
    .filter((item): item is MenuItem => item !== undefined);

  return (
    <main>
      <Navigation />
      <ItemDetailClient 
        item={item}
        category={category}
        subCategory={subCategory}
        allCategories={allCategories}
        recommendedItems={recommendedItems}
        recommendedItemsData={recommendedItemsData}
      />
      <Footer />
    </main>
  );
} 