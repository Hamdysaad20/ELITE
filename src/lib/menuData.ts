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
    name: 'Classic Drinks',
    description: 'Timeless coffee shop staples with an Elite Coffee twist',
    icon: 'coffee',
    comingSoon: false,
    subCategories: [
      {
        id: 'espresso-based',
        name: 'Espresso Classics',
        description: 'Bold and balanced espresso drinks',
        items: [
          {
            id: 'americano',
            name: 'Americano',
            description: 'Smooth espresso with hot water for a bold, clean taste',
            price: 25,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'cappuccino',
            name: 'Cappuccino',
            description: 'Espresso with steamed milk and a thick, frothy foam cap',
            price: 30,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: true,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'flat-white',
            name: 'Flat White',
            description: 'Creamy espresso with velvety steamed milk for a smooth finish',
            price: 32,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'cafe-latte',
            name: 'Café Latte',
            description: 'Balanced espresso blended with steamed milk for a cozy sip',
            price: 28,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'cafe-creme',
            name: 'Café Crème',
            description: 'Rich espresso topped with a light, frothy cream layer',
            price: 30,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'mocha',
            name: 'Mocha',
            description: 'Espresso, rich chocolate, and steamed milk for a sweet, indulgent escape',
            price: 35,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: true,
            available: true,
            allergens: ['Milk', 'Chocolate'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Chocoloco Whipped Cream', price: 3, available: true, character: 'Chocoloco' },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'espresso',
            name: 'Espresso',
            description: 'Bold and intense, served as Single or Double in Cartoon (4 oz) only',
            price: 20,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [
              { name: 'Cartoon 4 oz (Single)', priceModifier: 0, available: true },
              { name: 'Cartoon 4 oz (Double)', priceModifier: 5, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: []
          },
          {
            id: 'cortado',
            name: 'Cortado',
            description: 'Equal parts espresso and steamed milk for a harmonious kick',
            price: 25,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'espresso-macchiato',
            name: 'Espresso Macchiato',
            description: 'Espresso with a dollop of frothy milk for a subtle touch',
            price: 22,
            category: 'classic-drinks',
            subCategory: 'espresso-based',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          }
        ]
      },
      {
        id: 'traditional',
        name: 'Traditional',
        description: 'Authentic and classic coffee experiences',
        items: [
          {
            id: 'turkish-coffee',
            name: 'Turkish Coffee',
            description: 'Authentic, aromatic, and rich, served Single or Double in Cartoon (4 oz) only',
            price: 25,
            category: 'classic-drinks',
            subCategory: 'traditional',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [
              { name: 'Cartoon 4 oz (Single)', priceModifier: 0, available: true },
              { name: 'Cartoon 4 oz (Double)', priceModifier: 5, available: true }
            ],
            flavors: [],
            toppings: [
              { name: 'Cardamom Infusion', price: 2, available: true }
            ]
          },
          {
            id: 'tea',
            name: 'Tea',
            description: 'Classic black, green, or mint tea, served hot or iced',
            price: 18,
            category: 'classic-drinks',
            subCategory: 'traditional',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Honey', price: 2, available: true },
              { name: 'Lemon', price: 1, available: true },
              { name: 'Mint', price: 1, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'special-drinks',
    name: 'Special Drinks',
    description: 'Creative, story-driven drinks that spark joy and adventure',
    icon: 'sparkles',
    comingSoon: false,
    subCategories: [
      {
        id: 'creative-lattes',
        name: 'Creative Lattes',
        description: 'Unique and flavorful latte creations',
        items: [
          {
            id: 'spanish-latte',
            name: 'Spanish Latte',
            description: 'Sweetened condensed milk with bold espresso for a luxurious treat',
            price: 35,
            category: 'special-drinks',
            subCategory: 'creative-lattes',
            images: ['/images/drink-hero.avif'],
            featured: true,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Cinnamon Dust', price: 2, available: true },
              { name: 'Vanilla', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'matcha-latte',
            name: 'Matcha Latte',
            description: 'Vibrant green matcha with creamy milk, served hot or iced',
            price: 38,
            category: 'special-drinks',
            subCategory: 'creative-lattes',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Strawberry', price: 3, available: true },
              { name: 'Honey', price: 2, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'chai-latte',
            name: 'Chai Latte',
            description: 'Spiced, cozy chai blended with steamed milk',
            price: 32,
            category: 'special-drinks',
            subCategory: 'creative-lattes',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Cinnamon', price: 2, available: true },
              { name: 'Vanilla', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          }
        ]
      },
      {
        id: 'cold-drinks',
        name: 'Cold Drinks',
        description: 'Refreshing and chilled beverages',
        items: [
          {
            id: 'cold-brew',
            name: 'Cold Brew',
            description: 'Smooth, slow-brewed coffee for a refreshing, clean taste',
            price: 30,
            category: 'special-drinks',
            subCategory: 'cold-drinks',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: [],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Vanilla', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'vanilla-cold-brew-latte',
            name: 'Vanilla Cold Brew Latte',
            description: 'Cold brew with sweet vanilla and creamy milk',
            price: 35,
            category: 'special-drinks',
            subCategory: 'cold-drinks',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'iced-macchiato',
            name: 'Iced Macchiato',
            description: 'Chilled espresso layered with frothy milk for a cool twist',
            price: 32,
            category: 'special-drinks',
            subCategory: 'cold-drinks',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Pistachio', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'iced-cappuccino',
            name: 'Iced Cappuccino',
            description: 'Cold, frothy cappuccino with a bold espresso core',
            price: 30,
            category: 'special-drinks',
            subCategory: 'cold-drinks',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'Caramel', price: 3, available: true },
              { name: 'Hazelnut', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          },
          {
            id: 'iced-strawberry-matcha-latte',
            name: 'Iced Strawberry Matcha Latte',
            description: 'Sweet strawberry meets earthy matcha, served cold in Plastic (14 oz, 16 oz) only',
            price: 40,
            category: 'special-drinks',
            subCategory: 'cold-drinks',
            images: ['/images/drink-hero.avif'],
            featured: true,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Plastic 14 oz', priceModifier: 0, available: true },
              { name: 'Plastic 16 oz', priceModifier: 3, available: true }
            ],
            flavors: [
              { name: 'Honey', price: 2, available: true },
              { name: 'Vanilla', price: 3, available: true }
            ],
            toppings: [
              { name: 'Whipped Cream', price: 2, available: true },
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ]
          }
        ]
      },
      {
        id: 'indulgent',
        name: 'Indulgent Treats',
        description: 'Sweet and creamy delights',
        items: [
          {
            id: 'hot-chocolate',
            name: 'Hot Chocolate',
            description: 'Rich and indulgent, loved by kids and adults',
            price: 28,
            category: 'special-drinks',
            subCategory: 'indulgent',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk', 'Chocolate'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [],
            toppings: [
              { name: 'Chocoloco Whipped Cream', price: 3, available: true, character: 'Chocoloco' },
              { name: 'VanillaBella Sprinkles', price: 2, available: true, character: 'VanillaBella' }
            ]
          },
          {
            id: 'coffee-frappe',
            name: 'Coffee Frappé',
            description: 'Blended icy coffee with your choice of flavor',
            price: 35,
            category: 'special-drinks',
            subCategory: 'indulgent',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [
              { name: 'White Mocha', price: 5, available: true },
              { name: 'Strawberry Cream', price: 5, available: true }
            ],
            toppings: [
              { name: 'Mangoboom Sprinkles', price: 2, available: true, character: 'Mangoboom' }
            ]
          },
          {
            id: 'mango-lassi',
            name: 'Mango Lassi',
            description: 'Creamy, tangy mango delight inspired by local flavors',
            price: 32,
            category: 'special-drinks',
            subCategory: 'indulgent',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true },
              { name: 'Cartoon 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 14 oz', priceModifier: 5, available: true },
              { name: 'Plastic 16 oz', priceModifier: 8, available: true }
            ],
            flavors: [],
            toppings: [
              { name: 'Mangoboom Sprinkles', price: 2, available: true, character: 'Mangoboom' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'kids-corner',
    name: "Kids' Corner",
    description: 'Fun, colorful drinks for young adventurers (Ages 7–13)',
    icon: 'heart',
    comingSoon: false,
    subCategories: [
      {
        id: 'character-drinks',
        name: 'Character Drinks',
        description: 'Playful drinks featuring our beloved characters',
        items: [
          {
            id: 'chocolocos-hot-chocolate',
            name: "Chocoloco's Hot Chocolate",
            description: 'Warm, rich hot chocolate with Chocoloco\'s whipped cream crown',
            price: 25,
            category: 'kids-corner',
            subCategory: 'character-drinks',
            images: ['/images/drink-hero.avif'],
            featured: true,
            available: true,
            allergens: ['Milk', 'Chocolate'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true }
            ],
            flavors: [],
            toppings: [
              { name: 'Rainbow Sprinkles', price: 1, available: true },
              { name: 'Chocolate Sprinkles', price: 1, available: true }
            ],
            character: 'Chocoloco',
            story: 'Join Chocoloco on a sweet adventure with this rich hot chocolate!'
          },
          {
            id: 'vanillabellas-frappe',
            name: "VanillaBella's Frappé",
            description: 'Creamy, blended vanilla drink with a sweet, kid-friendly vibe',
            price: 28,
            category: 'kids-corner',
            subCategory: 'character-drinks',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true }
            ],
            flavors: [],
            toppings: [
              { name: 'VanillaBella Sprinkles', price: 2, available: true, character: 'VanillaBella' }
            ],
            character: 'VanillaBella',
            story: 'VanillaBella brings you a magical vanilla treat!'
          },
          {
            id: 'mangoboom-lassi',
            name: 'Mangoboom Lassi',
            description: 'Tangy mango lassi with a burst of fun sprinkles',
            price: 26,
            category: 'kids-corner',
            subCategory: 'character-drinks',
            images: ['/images/drink-hero.avif'],
            featured: false,
            available: true,
            allergens: ['Milk'],
            sizes: [
              { name: 'Cartoon 4 oz', priceModifier: 0, available: true }
            ],
            flavors: [],
            toppings: [
              { name: 'Mangoboom Sprinkles', price: 2, available: true, character: 'Mangoboom' }
            ],
            character: 'Mangoboom',
            story: 'Mangoboom makes every sip a tropical adventure!'
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