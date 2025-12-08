# Website Frontend Implementation Plan

> **Status**: Planning Phase  
> **Created**: 2025-12-08  
> **Objective**: Implement product detail pages, shopping cart, and auth-gated checkout with full Odoo data integration

## Executive Summary

We are implementing a complete e-commerce frontend for the Elite Coffee Shop website that allows users to:
1. Browse products with full details (343 products from Odoo)
2. View product pages with all attributes and pricing
3. Add items to cart with customization options
4. Browse without authentication
5. Require authentication only at checkout
6. Persist cart across authentication flow

## Current State Analysis

### What We Have

#### 1. **Product Data Source (Odoo 19)**
- **Total Products**: 343 products (281 templates, 345 variants)
- **Categories**: 25 website categories, 27 POS categories
- **Attributes**: 16+ product attributes with pricing
  - Size (Small, Medium +10 EGP, Large +20 EGP)
  - Turkish Sugar Level (5 traditional options)
  - Premium Toppings (10 options, multi-select)
  - Milk Options, Shots, Marshmallow, Chocolate Type, etc.

#### 2. **Auto-Refresh Cache System** ✅
- **TTL**: 5 minutes (300 seconds)
- **Auto-Sync**: Triggers on cache miss or staleness
- **Keys**: 
  - `products:all` - All 343 products
  - `categories:list` - All categories
  - `products:{id}` - Individual products
  - `sync:last_update` - Timestamp
  - `sync:etag` - Data hash

#### 3. **API Endpoints** ✅
```typescript
GET /api/products
  - Query params: id, categoryId, limit, page, pageSize, category, search, availability
  - Response: { success: true, data: Product[] | { items, page, total } }
  - Auto-syncs if cache stale

GET /api/products/[id]
  - Response: Single product with full attributes

POST /api/sync/products
  - Requires: x-admin-token header
  - Syncs from Odoo to Redis cache
  - Returns: { products: 343, categories: 25, lastUpdate, etag }
```

#### 4. **Existing Cart System** ✅
Located in:
- `/src/app/api/cart/route.ts` - GET, POST cart operations
- `/src/app/api/cart/[itemId]/route.ts` - DELETE, PATCH operations
- `/src/hooks/useCart.ts` - React hook with optimistic updates
- `/src/server/utils/jsonDatabase.ts` - Cart persistence (JSON file or in-memory)

Features:
- Add to cart with size, flavor, toppings
- Update quantity
- Remove items
- Price calculation with validation
- NextAuth integration (requires authentication currently)

#### 5. **Authentication System** ✅
- **Provider**: NextAuth.js
- **Location**: `/src/app/auth/*`
- **Hook**: `useSession()` from `next-auth/react`
- **API Client**: `/src/lib/auth/apiClient.ts`
- **Session Management**: Server-side with cookies

#### 6. **Existing Product Detail Page** ✅
- **Location**: `/src/components/ItemDetailClient.tsx`
- **Current Data**: Uses static `menuData` from `/src/lib/menuData.ts`
- **Features**:
  - Image carousel
  - Size selection (hardcoded)
  - Flavor selection
  - Toppings (multi-select)
  - Price calculation
  - Add to Order button (commented out)
  - Recommended products
- **Issues**:
  - Not connected to Odoo API
  - Uses hardcoded menu data
  - No quantity selector
  - No cart integration

### Data Schema Comparison

#### Current Static Data (`menuData.ts`):
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  images: string[];
  sizes: Size[];      // { name, priceModifier, available }
  flavors: Flavor[];  // { name, price, available }
  toppings: Topping[]; // { name, price, available }
}
```

#### Odoo API Response (`/api/products`):
```typescript
type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  available?: boolean;
  images?: string[];  // Base64 data URIs
  sku?: string;
  stock?: number | null;
  sequence?: number;
  attributes?: Record<string, AttributeValue[]>;
  // attributes structure:
  // {
  //   "Size": [
  //     { id: 2811, name: "Small", priceExtra: 0 },
  //     { id: 2812, name: "Medium", priceExtra: 10 },
  //     { id: 2813, name: "Large", priceExtra: 20 }
  //   ],
  //   "Milk Options": [
  //     { id: 123, name: "Oat Milk", priceExtra: 25 },
  //     ...
  //   ]
  // }
}
```

**Key Differences**:
1. Attributes are grouped by name (e.g., "Size", "Milk Options")
2. Each attribute value has `id`, `name`, `priceExtra`
3. Images are base64 encoded
4. Category is an object, not string
5. No `subCategory` field (need to determine routing strategy)

## Implementation Requirements

### Phase 1: Product Detail Page with Odoo Data

#### 1.1 Update Product Page to Fetch from API
**File**: `/src/app/menu/[category]/[subCategory]/[itemId]/page.tsx` (need to find this)

**Changes**:
- Replace static `menuData` with API call to `/api/products?id={itemId}`
- Handle loading states
- Handle errors (product not found, API failure)
- Pass Odoo product structure to `ItemDetailClient`

#### 1.2 Adapt ItemDetailClient to Odoo Data Structure
**File**: `/src/components/ItemDetailClient.tsx`

**Changes**:
- Update props interface to accept Odoo `Product` type
- Map `attributes` to render dynamic attribute selectors
- Support both single-select and multi-select attributes
- Calculate price with `priceExtra` instead of `priceModifier`
- Handle missing images gracefully
- Update category/subCategory navigation (may need new routing logic)

**UI Components Needed**:
```typescript
// Generic attribute selector
function AttributeSelector({
  attributeName: string;
  values: AttributeValue[];
  selected: string | string[];
  multiSelect: boolean;
  onChange: (selected: string | string[]) => void;
}) {
  // Render radio buttons for single-select
  // Render checkboxes for multi-select
  // Show priceExtra for each option
}
```

#### 1.3 Add Quantity Selector
**Component**: New `QuantitySelector.tsx`

```typescript
interface QuantitySelectorProps {
  quantity: number;
  onChange: (qty: number) => void;
  min?: number;  // Default: 1
  max?: number;  // Default: CART_CONFIG.MAX_QUANTITY (from constants)
}
```

**Features**:
- Increment/decrement buttons
- Direct input (validate on blur)
- Min/max constraints
- Disabled state

### Phase 2: Shopping Cart System

#### 2.1 Cart State Management Strategy

**Option A: Server-Side Cart (Current)**
- ✅ Pros: Persistent across devices, no localStorage limits, secure
- ❌ Cons: Requires backend call for every action, complex for unauthenticated users

**Option B: Client-Side Cart with Sync**
- ✅ Pros: Instant updates, works without auth, simple
- ❌ Cons: Lost on device change, browser storage limits

**Recommended: Hybrid Approach**
1. **Guest Users**: Store cart in `localStorage`
2. **Authenticated Users**: Store cart in backend (current system)
3. **On Login**: Merge localStorage cart with backend cart

**Implementation**:
```typescript
// /src/hooks/useLocalCart.ts (new)
export function useLocalCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Load from localStorage on mount
  // Persist to localStorage on changes
  // Provide: addItem, removeItem, updateQuantity, clearCart
}

// /src/hooks/useHybridCart.ts (new)
export function useHybridCart() {
  const { status } = useSession();
  const localCart = useLocalCart();
  const serverCart = useCart(); // existing hook
  
  // If authenticated, use serverCart
  // If not authenticated, use localCart
  // On auth change, merge carts
}
```

#### 2.2 Cart UI Components

**Component**: `/src/components/Cart/CartDrawer.tsx`
- Slide-in drawer from right
- List of cart items with:
  - Product image
  - Name
  - Selected attributes (Size: Large, Milk: Oat Milk, etc.)
  - Quantity selector
  - Price (base + extras)
  - Remove button
- Subtotal, tax, total
- "Proceed to Checkout" button (shows login prompt if not authenticated)

**Component**: `/src/components/Cart/CartButton.tsx`
- Floating button (bottom-right or header)
- Shows cart item count badge
- Opens CartDrawer on click

**Component**: `/src/components/Cart/CartItem.tsx`
- Individual item in cart
- Quantity adjustment
- Remove button
- Price display

#### 2.3 Add to Cart Flow

**From Product Detail Page**:
1. User selects attributes (size, flavor, toppings, etc.)
2. User adjusts quantity
3. Click "Add to Cart" button
4. Validate selections (required attributes selected)
5. Calculate total price
6. Call appropriate cart hook (local or server)
7. Show success toast/notification
8. Update cart badge count

**CartItem Structure**:
```typescript
interface CartItem {
  id: string;                    // Unique cart item ID
  productId: string;             // Odoo product ID
  name: string;                  // Product name
  basePrice: number;             // Base product price
  quantity: number;
  attributes: {
    [attributeName: string]: {
      valueId: number;
      valueName: string;
      priceExtra: number;
    }[];
  };
  totalPrice: number;            // (basePrice + sum(priceExtra)) * quantity
  image?: string;                // First product image
}
```

### Phase 3: Auth-Gated Checkout

#### 3.1 Cart Access Without Auth
- ✅ Users can browse products
- ✅ Users can add to cart (localStorage)
- ✅ Users can view cart
- ❌ Users cannot checkout without login

#### 3.2 Login Prompt at Checkout
**Flow**:
1. User clicks "Proceed to Checkout" in CartDrawer
2. If `status === 'unauthenticated'`:
   - Save current cart to `localStorage` (if not already)
   - Redirect to `/auth/signin?callbackUrl=/checkout`
3. User completes authentication
4. Redirect back to `/checkout`
5. Merge localStorage cart with server cart (if any)
6. Clear localStorage cart
7. Proceed with checkout

**Implementation**:
```typescript
// In CartDrawer.tsx
const { status } = useSession();

const handleCheckout = () => {
  if (status === 'unauthenticated') {
    // Save cart to localStorage (already done by useLocalCart)
    router.push('/auth/signin?callbackUrl=/checkout');
  } else {
    router.push('/checkout');
  }
};
```

#### 3.3 Cart Merging Logic
**File**: `/src/lib/cart/mergeCart.ts` (new)

```typescript
export async function mergeLocalCartToServer(
  localCart: CartItem[],
  userId: string
): Promise<void> {
  // For each item in localCart:
  //   1. Check if identical item exists in server cart
  //   2. If yes: Add quantities
  //   3. If no: Add new item
  // Clear local cart after merge
}
```

**Trigger**: On successful login, check for localStorage cart and merge

### Phase 4: Edge Cases & Error Handling

#### 4.1 Product Availability
- Show "Out of Stock" badge if `available === false` or `stock === 0`
- Disable "Add to Cart" button
- Show alternative products

#### 4.2 Price Changes
- If product price changes while in cart:
  - Show warning in cart: "Price updated from X to Y"
  - Update cart item price
  - Recalculate total

#### 4.3 Attribute Validation
- Required attributes (e.g., Size) must be selected
- Show validation error if not selected
- Highlight missing selections

#### 4.4 Cart Item Limits
- Enforce `CART_CONFIG.MAX_QUANTITY` per item
- Show error if limit exceeded
- Max cart size (e.g., 50 items total)

#### 4.5 Session Expiry
- If session expires during shopping:
  - Cart moves back to localStorage
  - Show message: "Session expired. Please log in to checkout."

#### 4.6 Concurrent Cart Updates
- Handle case where user has cart on multiple devices
- Last write wins (server cart is source of truth after login)

## Implementation Phases

### Phase 1: Foundation (2-3 days)
- [ ] Update product detail page to fetch from Odoo API
- [ ] Adapt ItemDetailClient to render dynamic attributes
- [ ] Add quantity selector component
- [ ] Test product page with various products (different attribute types)

### Phase 2: Cart System (3-4 days)
- [ ] Implement `useLocalCart` hook
- [ ] Implement `useHybridCart` hook
- [ ] Create CartDrawer, CartButton, CartItem components
- [ ] Implement add to cart flow
- [ ] Test cart operations (add, remove, update quantity)

### Phase 3: Auth Integration (2-3 days)
- [ ] Implement auth check at checkout
- [ ] Create login redirect flow
- [ ] Implement cart merging logic
- [ ] Test auth flow (guest → login → checkout)

### Phase 4: Polish & Edge Cases (2-3 days)
- [ ] Handle all edge cases (out of stock, price changes, etc.)
- [ ] Add loading states and error messages
- [ ] Implement success notifications
- [ ] Add cart persistence cleanup (localStorage management)
- [ ] Responsive design for mobile

### Phase 5: Testing & Validation (2 days)
- [ ] Test complete flow end-to-end
- [ ] Test with all attribute types (Size, Milk, Toppings, etc.)
- [ ] Test cart merge scenarios
- [ ] Test session expiry
- [ ] Test concurrent devices
- [ ] Performance testing (large carts)

## Technical Decisions

### 1. Routing Strategy
**Current Structure**: `/menu/[category]/[subCategory]/[itemId]`
**Issue**: Odoo products don't have `subCategory`

**Options**:
- **Option A**: Use `categoryId` from Odoo, create synthetic subCategory
- **Option B**: Change to `/products/[id]` (simple, no nesting)
- **Option C**: Use category hierarchy: `/menu/[categoryName]/[productId]`

**Recommendation**: Option B for simplicity, maintain existing `/menu` routes for category browsing

### 2. Attribute Rendering
**Challenge**: Different products have different attributes

**Solution**: Dynamic attribute renderer
```typescript
// Detect multi-select attributes by name pattern or count
const isMultiSelect = (attributeName: string) => {
  return attributeName.toLowerCase().includes('topping') ||
         attributeName.toLowerCase().includes('extra');
};

// Render appropriate UI
attributes && Object.entries(attributes).map(([name, values]) => {
  const multi = isMultiSelect(name);
  return <AttributeSelector key={name} multiSelect={multi} ... />;
});
```

### 3. Price Calculation
**Current**: Uses `priceModifier` (can be negative)
**Odoo**: Uses `priceExtra` (always positive, 0 for no extra cost)

**Update**:
```typescript
// OLD
let price = item.price;
const size = item.sizes.find(s => s.name === selectedSize);
if (size) price += size.priceModifier; // Can be -10, 0, +10

// NEW (Odoo)
let price = product.price;
const selectedAttrs = getSelectedAttributes(); // { Size: [{ id, name, priceExtra: 10 }], ... }
Object.values(selectedAttrs).forEach(attrValues => {
  attrValues.forEach(val => {
    price += val.priceExtra;
  });
});
```

### 4. Image Handling
**Odoo Format**: Base64 data URIs (`data:image/png;base64,iVBOR...`)
**Current**: Static URLs (`/images/menu/drinks/americano.png`)

**Solution**: Support both, add fallback placeholder
```typescript
const imageUrl = product.images?.[0] || '/images/placeholder.png';
<img src={imageUrl} alt={product.name} />
```

### 5. Cart Item Uniqueness
**Challenge**: Same product with different attributes = different cart item

**Solution**: Generate unique key
```typescript
function getCartItemKey(productId: string, attributes: Record<string, any>): string {
  const sortedAttrs = JSON.stringify(
    Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, Array.isArray(v) ? v.sort() : v])
  );
  return `${productId}-${crypto.createHash('md5').update(sortedAttrs).digest('hex')}`;
}
```

## Testing Strategy

### 1. API Schema Validation
Test products with different attribute configurations:
- Product with Size only (Turkish Coffee)
- Product with Size + Milk Options (Latte)
- Product with Size + Premium Toppings (Milkshake)
- Product with multiple multi-select (Custom Sandwich: Bread, Protein, Cheese, Vegetables, Sauces)
- Product with no attributes (Simple item)

### 2. Cart Operations
- Add item with attributes
- Add same item with different attributes
- Add duplicate item (should increase quantity)
- Update quantity (increase/decrease)
- Remove item
- Clear cart

### 3. Auth Flow
- Guest: Add to cart → View cart → Click checkout → Redirect to login
- Guest: Complete login → Redirect to checkout → Cart preserved
- Logged-in: Add to cart → Checkout directly
- Guest with cart → Login → Merge with existing server cart

### 4. Edge Cases
- Product becomes unavailable while in cart
- Price changes while in cart
- Session expires during shopping
- Multiple tabs/devices
- Browser refresh during checkout
- localStorage full (fallback?)

## Performance Considerations

### 1. Image Optimization
- Base64 images are large (consider converting to blob URLs)
- Lazy load images in cart
- Use thumbnails in cart, full size on product page

### 2. Cart State Updates
- Use optimistic updates in useCart
- Debounce quantity changes
- Batch API calls when possible

### 3. Cache Strategy
- Cache product data in React Query or SWR
- Invalidate on price/availability changes
- Background sync for cart

## Next Steps

1. **Verify API endpoints are working**
   - Sync products from Odoo (may need ADMIN_TOKEN)
   - Test `/api/products` with various queries
   - Test single product fetch `/api/products?id={id}`

2. **Map Existing Components**
   - Find all product page files
   - Find existing cart-related files
   - Identify reusable UI components

3. **Create Detailed Task List**
   - Break down each phase into specific PRs
   - Assign complexity estimates
   - Identify dependencies

4. **Set Up Development Environment**
   - Ensure Redis is running
   - Ensure Odoo connection is active
   - Sync products to cache

## Open Questions

1. **Routing**: Should we change product URLs to `/products/[id]`?
2. **Categories**: How to handle missing subCategory in Odoo data?
3. **Multi-Select Logic**: Which attributes should be multi-select? (Currently guessing by name)
4. **Stock Display**: Should we show stock levels on product pages?
5. **Cart Size**: What's the maximum cart size limit?
6. **Checkout Flow**: What happens after checkout? (Order creation, payment, etc.)

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating Odoo product data into the Elite Coffee Shop website frontend. The hybrid cart approach (localStorage for guests, server for authenticated) ensures a smooth user experience while maintaining data persistence and security.

**Estimated Timeline**: 10-15 days
**Priority**: High (required for website launch)
**Dependencies**: Odoo sync must be working, Redis must be available

---

**Next Action**: Review this plan with stakeholders, verify API endpoints, and begin Phase 1 implementation.
