# Elite Coffee Menu System

## Overview

The menu system follows a clean MVC (Model-View-Controller) architecture with scalable, maintainable code that separates data from presentation logic. The system is designed to be easily integrated with a backend ordering system in the future.

## Architecture

### Data Layer (Model)
- **File**: `src/lib/menuData.ts`
- **Purpose**: Contains all menu data structures, interfaces, and helper functions
- **Future**: Will be replaced with API calls to the backend ordering system

### Components (View)
- **Main Menu Page**: `src/app/menu/page.tsx`
- **Category Page**: `src/app/menu/[category]/page.tsx`
- **Subcategory Page**: `src/app/menu/[category]/[subcategory]/page.tsx`
- **Item Detail Page**: `src/app/menu/[category]/[subcategory]/[item]/page.tsx`
- **Menu Image Component**: `src/components/MenuImage.tsx`

## URL Structure

```
/menu                           # Main menu page
/menu/[category]                # Category page (e.g., /menu/drinks)
/menu/[category]/[subcategory]  # Subcategory page (e.g., /menu/drinks/hot-coffee)
/menu/[category]/[subcategory]/[item]  # Item detail page
```

## Features

### 1. Main Menu Page
- Large "MENU" text with drink image overlay
- Category cards with hover effects
- Coming soon indicators
- Dashboard-like design

### 2. Category Pages
- Left-side navigation showing all categories and subcategories
- Featured items display
- Subcategory grid layout
- Breadcrumb navigation

### 3. Subcategory Pages
- Item grid with pricing and features
- Allergen information
- Availability status
- Featured item badges

### 4. Item Detail Pages
- Image slider with navigation
- Size selection with price modifiers
- Topping selection
- Flavor options
- Allergen information
- Real-time price calculation
- Recommended products with package offers

### 5. Navigation Features
- Sticky left-side navigation
- Breadcrumb trails
- Hover effects and transitions
- Mobile-responsive design

## Data Structure

### MenuItem Interface
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subCategory: string;
  sizes: SizeOption[];
  toppings: ToppingOption[];
  flavors: FlavorOption[];
  allergens: string[];
  available: boolean;
  featured: boolean;
}
```

### Categories
- **Drinks**: Hot Coffee, Cold Coffee, Bubble Tea
- **Food**: Bakery items
- **At Home Coffee**: Coming soon

## Design System

### Colors
- Primary: Elite Burgundy (`#8b2635`)
- Secondary: Elite Cream (`#f8f0d2`)
- Accent: Elite Dark Burgundy (`#6b1f2a`)

### Typography
- Headings: Calistoga (serif)
- Body: Cabin Condensed (sans-serif)

### Components
- Rounded corners (2xl)
- Shadow effects
- Hover animations
- Smooth transitions

## Scalability Features

### 1. Modular Components
- Reusable MenuImage component
- Consistent navigation patterns
- Standardized card layouts

### 2. Data Abstraction
- Helper functions for data access
- Type-safe interfaces
- Easy to extend with new categories/items

### 3. Performance
- Lazy loading images
- Optimized re-renders
- Efficient state management

### 4. Future Integration
- API-ready data structure
- Backend integration points identified
- Real-time availability updates
- Order system integration

## Recommended Products System

The system automatically recommends complementary items:
- Drinks recommend food items
- Food items recommend drinks
- Package offers with discounts
- Smart pairing logic

## Allergen Management

- Clear allergen labeling
- Visual indicators
- Detailed allergen information
- Safety disclaimers

## Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly navigation
- Optimized for mobile ordering
- Adaptive image sizing

## Future Enhancements

1. **Backend Integration**
   - Real-time inventory
   - Dynamic pricing
   - Order management

2. **Advanced Features**
   - Search functionality
   - Filtering options
   - Favorites system
   - Nutritional information

3. **User Experience**
   - Quick add to cart
   - Order history
   - Personalized recommendations
   - Loyalty program integration 