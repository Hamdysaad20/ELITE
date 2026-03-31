// Types
export interface Size {
  name: string;
  priceModifier: number;
  available: boolean;
}

export interface Flavor {
  name: string;
  price: number;
  available: boolean;
}

export interface Topping {
  name: string;
  price: number;
  available: boolean;
  character?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  images: string[];
  featured: boolean;
  available: boolean;
  allergens: string[];
  sizes: Size[];
  flavors: Flavor[];
  toppings: Topping[];
  character?: string;
  story?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  comingSoon: boolean;
  subCategories: SubCategory[];
}

export interface RecommendedItem {
  itemId: string;
  reason: string;
  packageOffer?: {
    name: string;
    description: string;
    discount: number;
  };
}

// Real Elite Coffee Menu Data
const menuData: MenuCategory[] = [
  {
    id: "food",
    name: "Food & Treats",
    description: "Delicious snacks and treats to complement your drinks",
    icon: "utensils",
    comingSoon: true,
    subCategories: [],
  },
  {
    id: "at-home-coffee",
    name: "At Home Coffee",
    description: "Premium coffee beans and brewing equipment for home baristas",
    icon: "home",
    comingSoon: true,
    subCategories: [],
  },
];

// Helper functions
export function getAllCategories(): MenuCategory[] {
  return menuData;
}

export function getCategoryById(id: string): MenuCategory | undefined {
  return menuData.find((category) => category.id === id);
}

export function getSubCategoryById(
  categoryId: string,
  subCategoryId: string,
): SubCategory | undefined {
  const category = getCategoryById(categoryId);
  if (!category) return undefined;

  return category.subCategories.find((sub) => sub.id === subCategoryId);
}

export function getItemById(id: string): MenuItem | undefined {
  for (const category of menuData) {
    for (const subCategory of category.subCategories) {
      const item = subCategory.items.find((item) => item.id === id);
      if (item) return item;
    }
  }
  return undefined;
}

export function getRecommendedItems(item: MenuItem): RecommendedItem[] {
  const recommendations: RecommendedItem[] = [];

  // Get items from the same category
  const category = getCategoryById(item.category);
  if (category) {
    for (const subCategory of category.subCategories) {
      for (const recItem of subCategory.items) {
        if (recItem.id !== item.id && recItem.available) {
          recommendations.push({
            itemId: recItem.id,
            reason: `More from ${category.name}`,
            packageOffer: {
              name: `${item.name} + ${recItem.name}`,
              description: `Perfect pairing for ${item.category}`,
              discount: 10,
            },
          });
        }
      }
    }
  }

  // Get featured items from other categories
  for (const category of menuData) {
    if (category.id !== item.category) {
      for (const subCategory of category.subCategories) {
        for (const recItem of subCategory.items) {
          if (
            recItem.featured &&
            recItem.available &&
            recommendations.length < 6
          ) {
            recommendations.push({
              itemId: recItem.id,
              reason: `Featured ${category.name}`,
              packageOffer: {
                name: `${item.name} + ${recItem.name}`,
                description: `Try something new from ${category.name}`,
                discount: 15,
              },
            });
          }
        }
      }
    }
  }

  return recommendations.slice(0, 6);
}

// Customization options
export const customizationOptions = {
  sizes: [
    { name: "Cartoon 4 oz", priceModifier: 0, available: true },
    { name: "Cartoon 14 oz", priceModifier: 5, available: true },
    { name: "Plastic 14 oz", priceModifier: 5, available: true },
    { name: "Plastic 16 oz", priceModifier: 8, available: true },
  ],
  shots: [
    { name: "Single", priceModifier: 0, available: true },
    { name: "Double", priceModifier: 5, available: true },
  ],
  flavors: [
    { name: "Caramel", price: 3, available: true },
    { name: "Pistachio", price: 3, available: true },
    { name: "Hazelnut", price: 3, available: true },
    { name: "Vanilla", price: 3, available: true },
    { name: "Cinnamon", price: 2, available: true },
    { name: "Strawberry", price: 3, available: true },
    { name: "Honey", price: 2, available: true },
    { name: "Mint", price: 1, available: true },
  ],
  toppings: [
    { name: "Whipped Cream", price: 2, available: true },
    { name: "Rainbow Sprinkles", price: 1, available: true },
    { name: "Chocolate Sprinkles", price: 1, available: true },
    {
      name: "Chocoloco Whipped Cream",
      price: 3,
      available: true,
      character: "Chocoloco",
    },
    {
      name: "VanillaBella Sprinkles",
      price: 2,
      available: true,
      character: "VanillaBella",
    },
    {
      name: "Mangoboom Sprinkles",
      price: 2,
      available: true,
      character: "Mangoboom",
    },
  ],
  milkOptions: [
    { name: "Whole Milk", priceModifier: 0, available: true },
    { name: "Oat Milk", priceModifier: 2, available: true },
    { name: "Almond Milk", priceModifier: 2, available: true },
  ],
  sweetness: [
    { name: "Regular", priceModifier: 0, available: true },
    { name: "Less Sugar", priceModifier: 0, available: true },
    { name: "Sugar-Free", priceModifier: 1, available: true },
  ],
};

export { menuData };
export default menuData;
