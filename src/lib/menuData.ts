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
    id: 'classic-drinks',
    name: 'Classic Essentials',
    description: 'Hot & iced',
    icon: 'coffee',
    comingSoon: false,
    subCategories: [
      {
        id: 'classic-essentials',
        name: 'Classic Essentials',
        description: 'Hot & iced',
        items: [
          {
            id: 'americano',
            name: 'Americano',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/american.png'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 65
              { name: 'Large', priceModifier: 10, available: true }   // 75
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'espresso-single',
            name: 'Espresso (Single)',
            description: 'Hot only',
            price: 40,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/espresso.png'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [{ name: 'Small', priceModifier: 0, available: true }],
            flavors: [],
            toppings: []
          },
          {
            id: 'espresso-double',
            name: 'Espresso (Double)',
            description: 'Hot only',
            price: 45,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/espresso.png'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [{ name: 'Small', priceModifier: 0, available: true }],
            flavors: [],
            toppings: []
          },
          {
            id: 'espresso-macchiato',
            name: 'Espresso Macchiato',
            description: 'Hot & iced',
            price: 70,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/flatwhite.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 60
              { name: 'Medium', priceModifier: 0, available: true },  // 65
              { name: 'Large', priceModifier: 10, available: true }   // 75
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'cortado',
            name: 'Cortado',
            description: 'Hot & iced',
            price: 70,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/cortado.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 60
              { name: 'Medium', priceModifier: 0, available: true },  // 65
              { name: 'Large', priceModifier: 10, available: true }   // 75
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'flat-white',
            name: 'Flat White',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/flat white.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 65
              { name: 'Large', priceModifier: 10, available: true }   // 75
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'cappuccino',
            name: 'Cappuccino',
            description: 'Hot & iced',
            price: 70,
            category: 'classic-drinks',
            subCategory: 'classic-essentials',
            images: ['/images/menu/drinks/capotcino.png'],
            featured: true,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -5, available: true },  // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 65
              { name: 'Large', priceModifier: 15, available: true }   // 75
            ],
            flavors: [],
            toppings: []
          }
        ]
      },
      {
        id: 'milk-classics',
        name: 'Milk Classics',
        description: 'Hot & iced',
        items: [
          {
            id: 'mocha',
            name: 'Mocha',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'milk-classics',
            images: ['/images/menu/drinks/mocha.png'],
            featured: false,
            available: true,
            allergens: ['Milk', 'Chocolate'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 75
              { name: 'Large', priceModifier: 10, available: true }   // 85
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'latte',
            name: 'Latte',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'milk-classics',
            images: ['/images/menu/drinks/latte.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 75
              { name: 'Large', priceModifier: 10, available: true }   // 85
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'spanish-latte',
            name: 'Spanish Latte',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'milk-classics',
            images: ['/images/menu/drinks/spanish latte.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 75
              { name: 'Large', priceModifier: 10, available: true }   // 85
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'frappuccino',
            name: 'Frappuccino',
            description: 'Hot & iced',
            price: 85,
            category: 'classic-drinks',
            subCategory: 'milk-classics',
            images: ['/images/menu/drinks/frappuccino.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 75
              { name: 'Medium', priceModifier: 0, available: true },  // 85
              { name: 'Large', priceModifier: 10, available: true }   // 95
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'chocolate',
            name: 'Chocolate',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'milk-classics',
            images: ['/images/menu/drinks/chocolate.png'],
            featured: false,
            available: true,
            allergens: ['Milk', 'Chocolate'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 75
              { name: 'Large', priceModifier: 10, available: true }   // 85
            ],
            flavors: [],
            toppings: []
          },
          {
            id: 'matcha-latte',
            name: 'Matcha Latte',
            description: 'Hot & iced',
            price: 75,
            category: 'classic-drinks',
            subCategory: 'milk-classics',
            images: ['/images/menu/drinks/matcha iced.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Small', priceModifier: -10, available: true }, // 65
              { name: 'Medium', priceModifier: 0, available: true },  // 75
              { name: 'Large', priceModifier: 10, available: true }   // 85
            ],
            flavors: [],
            toppings: []
          }
        ]
      },
      {
        id: 'elite-originals',
        name: 'Elite Originals',
        description: 'Hot only',
        items: [
          {
            id: 'turkish-coffee',
            name: 'Turkish Coffee',
            description: 'Hot only',
            price: 40,
            category: 'classic-drinks',
            subCategory: 'elite-originals',
            images: ['/images/menu/drinks/turkesh.png'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [{ name: 'Small', priceModifier: 0, available: true }],
            flavors: [],
            toppings: []
          },
          {
            id: 'classic-teas',
            name: 'Classic Teas',
            description: 'Hot only',
            price: 40,
            category: 'classic-drinks',
            subCategory: 'elite-originals',
            images: ['/images/menu/drinks/tea.png'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [{ name: 'Small', priceModifier: 0, available: true }],
            flavors: [],
            toppings: []
          },
          {
            id: 'karak-chai',
            name: 'Karak Chai',
            description: 'Hot only',
            price: 40,
            category: 'classic-drinks',
            subCategory: 'elite-originals',
            images: ['/images/menu/drinks/karak.png'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [{ name: 'Small', priceModifier: 0, available: true }],
            flavors: [],
            toppings: []
          }
        ]
      }
    ]
  },
  {
    id: 'food',
    name: 'Food & Treats',
    description: 'Delicious snacks and treats to complement your drinks',
    icon: 'utensils',
    comingSoon: true,
    subCategories: []
  },
  {
    id: 'at-home-coffee',
    name: 'At Home Coffee',
    description: 'Premium coffee beans and brewing equipment for home baristas',
    icon: 'home',
    comingSoon: true,
    subCategories: []
  }
];

// Helper functions
export function getAllCategories(): MenuCategory[] {
  return menuData;
}

export function getCategoryById(id: string): MenuCategory | undefined {
  return menuData.find(category => category.id === id);
}

export function getSubCategoryById(categoryId: string, subCategoryId: string): SubCategory | undefined {
  const category = getCategoryById(categoryId);
  if (!category) return undefined;
  
  return category.subCategories.find(sub => sub.id === subCategoryId);
}

export function getItemById(id: string): MenuItem | undefined {
  for (const category of menuData) {
    for (const subCategory of category.subCategories) {
      const item = subCategory.items.find(item => item.id === id);
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
              discount: 10
            }
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
          if (recItem.featured && recItem.available && recommendations.length < 6) {
            recommendations.push({
              itemId: recItem.id,
              reason: `Featured ${category.name}`,
              packageOffer: {
                name: `${item.name} + ${recItem.name}`,
                description: `Try something new from ${category.name}`,
                discount: 15
              }
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
    { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
    { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
    { name: 'Plastic 14 oz', priceModifier: 5, available: true },
    { name: 'Plastic 16 oz', priceModifier: 8, available: true }
  ],
  shots: [
    { name: 'Single', priceModifier: 0, available: true },
    { name: 'Double', priceModifier: 5, available: true }
  ],
  flavors: [
    { name: 'Caramel', price: 3, available: true },
    { name: 'Pistachio', price: 3, available: true },
    { name: 'Hazelnut', price: 3, available: true },
    { name: 'Vanilla', price: 3, available: true },
    { name: 'Cinnamon', price: 2, available: true },
    { name: 'Strawberry', price: 3, available: true },
    { name: 'Honey', price: 2, available: true },
    { name: 'Mint', price: 1, available: true }
  ],
  toppings: [
    { name: 'Whipped Cream', price: 2, available: true },
    { name: 'Rainbow Sprinkles', price: 1, available: true },
    { name: 'Chocolate Sprinkles', price: 1, available: true },
    { name: 'Chocoloco Whipped Cream', price: 3, available: true, character: 'Chocoloco' },
    { name: 'VanillaBella Sprinkles', price: 2, available: true, character: 'VanillaBella' },
    { name: 'Mangoboom Sprinkles', price: 2, available: true, character: 'Mangoboom' }
  ],
  milkOptions: [
    { name: 'Whole Milk', priceModifier: 0, available: true },
    { name: 'Oat Milk', priceModifier: 2, available: true },
    { name: 'Almond Milk', priceModifier: 2, available: true }
  ],
  sweetness: [
    { name: 'Regular', priceModifier: 0, available: true },
    { name: 'Less Sugar', priceModifier: 0, available: true },
    { name: 'Sugar-Free', priceModifier: 1, available: true }
  ]
}; 