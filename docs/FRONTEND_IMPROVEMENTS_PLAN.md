# Frontend Improvements - Comprehensive Implementation Plan

**Goal**: Implement robust error handling, empty states, and Next.js 15 best practices with optimistic UI patterns. All data should be treated as optional with defensive programming.

---

## 1. Update Hooks with Next.js 15 Features & Defensive Coding

### 1.1 useProducts Hook Improvements
**File**: `src/hooks/useProducts.ts`

**Changes**:
- ✅ Add `useTransition` for non-blocking state updates
- ✅ Add `isEmpty` state flag
- ✅ Add `isRefetching` state flag
- ✅ Improve error messages (network, 503, generic)
- ✅ Make `available` optional in Product interface
- ✅ Add defensive null checks in `getProductById`
- ✅ Handle missing response data gracefully
- ✅ Add timeout handling for slow requests
- ✅ Implement retry logic with exponential backoff

**New Interface**:
```typescript
interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  refetch: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  isEmpty: boolean;
  isRefetching: boolean;
  retryCount: number;
}
```

### 1.2 useCategories Hook Improvements
**File**: `src/hooks/useCategories.ts`

**Changes**:
- ✅ Add `useTransition` for smooth updates
- ✅ Add `isEmpty` state flag
- ✅ Add `isRefetching` state flag
- ✅ Improve error messages
- ✅ Add defensive null checks
- ✅ Handle optional fields (productCount, image, description)
- ✅ Implement retry logic

### 1.3 Create useProduct Hook (Single Product)
**File**: `src/hooks/useProducts.ts`

**Changes**:
- ✅ Already exists, needs improvement
- ✅ Add loading skeleton support
- ✅ Add error boundary integration
- ✅ Handle 404 gracefully
- ✅ Cache product data locally

---

## 2. Enhance DrinkCard Component - Optional Data Handling

### 2.1 Make All Data Optional
**File**: `src/components/DrinkCard.tsx`

**Changes**:
- ✅ Handle missing/multiple images gracefully
- ✅ Add image carousel for multiple images
- ✅ Fallback for missing price
- ✅ Fallback for missing description
- ✅ Handle missing name/title
- ✅ Add image loading states
- ✅ Add image error states with placeholder
- ✅ Implement lazy loading for images
- ✅ Add skeleton loader

**Updated Props**:
```typescript
interface DrinkCardProps {
  id?: string;
  images?: string[];  // Changed from image: string
  name?: string;
  price?: number;
  description?: string;
  available?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  href?: string;
  menuItemId?: string;
  showAddToOrder?: boolean;
  categoryId?: string;
}
```

### 2.2 Image Handling
- ✅ Show first image by default
- ✅ Add dots indicator for multiple images
- ✅ Auto-rotate images if multiple
- ✅ Blur-up placeholder while loading
- ✅ Graceful error handling with SVG placeholder
- ✅ Support base64 images from Odoo
- ✅ Support external URLs
- ✅ Add Next.js Image optimization

---

## 3. Improve Menu Page - Error & Empty States

### 3.1 Loading States
**File**: `src/app/menu/page.tsx`

**Changes**:
- ✅ Replace simple loader with skeleton UI
- ✅ Show category skeleton pills
- ✅ Show product card skeletons
- ✅ Add shimmer effect
- ✅ Progressive loading (categories first, then products)

### 3.2 Error States
**Scenarios to Handle**:
1. **Network Error**: No internet connection
2. **503 Service Unavailable**: Cache empty/syncing
3. **500 Server Error**: Backend issue
4. **Timeout Error**: Request took too long
5. **Parse Error**: Invalid JSON response
6. **Auth Error**: Session expired

**UI Elements**:
- ✅ Error icon + message
- ✅ Retry button with loading state
- ✅ Contact support link
- ✅ Fallback to static data option
- ✅ Error boundary wrapper

### 3.3 Empty States
**Scenarios**:
1. **No Categories**: Fresh system, no data synced
2. **No Products in Category**: Category exists but empty
3. **No Search Results**: Search returned nothing
4. **All Products Unavailable**: All marked as unavailable

**UI Elements**:
- ✅ Empty state illustration
- ✅ Helpful message
- ✅ Primary action (Sync, Browse All, Clear Search)
- ✅ Secondary info (when was last sync)

### 3.4 Defensive Data Mapping
**Changes**:
```typescript
// Old - assumes data exists
items: categoryProducts.map(p => ({
  id: p.id,
  name: p.title,
  price: p.price,
}))

// New - defensive with fallbacks
items: (categoryProducts || []).map(p => ({
  id: p?.id || 'unknown',
  name: p?.title || 'Unnamed Product',
  price: p?.price ?? 0,
  images: p?.images && p.images.length > 0 ? p.images : ['/images/placeholder.svg'],
  available: p?.available ?? true,
  description: p?.description || '',
})).filter(item => item.id !== 'unknown')
```

---

## 4. Create Reusable UI State Components

### 4.1 LoadingState Component
**File**: `src/components/ui/LoadingState.tsx`

**Features**:
- Customizable message
- Different variants (spinner, skeleton, progress)
- Size options (small, medium, large)
- Full-screen overlay option

### 4.2 ErrorState Component
**File**: `src/components/ui/ErrorState.tsx`

**Features**:
- Error type detection (network, server, timeout)
- Custom error messages
- Retry button with debounce
- Error reporting option
- Collapsible error details (for devs)

### 4.3 EmptyState Component
**File**: `src/components/ui/EmptyState.tsx`

**Features**:
- Custom icon/illustration
- Title and description
- Primary action button
- Secondary action link
- Different variants (no-data, no-results, coming-soon)

### 4.4 ImageWithFallback Component
**File**: `src/components/ui/ImageWithFallback.tsx`

**Features**:
- Automatic fallback on error
- Loading placeholder
- Lazy loading
- Multiple image support
- Next.js Image optimization
- Base64 support
- Blur placeholder

### 4.5 SkeletonLoader Component
**File**: `src/components/ui/SkeletonLoader.tsx`

**Variants**:
- ProductCardSkeleton
- CategoryPillSkeleton
- ProductGridSkeleton
- Generic rectangle/circle/text skeletons

---

## 5. Add Image Fallback & Error Handling

### 5.1 Centralized Image Utilities
**File**: `src/lib/imageUtils.ts`

**Functions**:
```typescript
// Validate image URL/base64
isValidImage(src: string): boolean

// Get fallback image by type
getFallbackImage(type: 'product' | 'category' | 'user'): string

// Convert Odoo base64 to optimized format
optimizeOdooImage(base64: string, quality?: number): string

// Preload image
preloadImage(src: string): Promise<void>

// Get image dimensions
getImageDimensions(src: string): Promise<{width: number, height: number}>
```

### 5.2 Image Error Boundary
**File**: `src/components/ImageErrorBoundary.tsx`

- Catch image loading errors
- Show fallback UI
- Log errors for monitoring
- Retry failed images

---

## 6. Implement Optimistic Cart Updates

### 6.1 Update useCart Hook
**File**: `src/hooks/useCart.ts`

**Changes**:
- ✅ Add `useOptimistic` for instant UI updates
- ✅ Add `useTransition` for non-blocking updates
- ✅ Implement optimistic add to cart
- ✅ Rollback on error
- ✅ Show temporary success state
- ✅ Queue multiple updates
- ✅ Sync with server on hydration

**Pattern**:
```typescript
const [optimisticCart, addOptimisticItem] = useOptimistic(
  cart,
  (state, newItem) => [...state, newItem]
);

const addToCart = async (item) => {
  // 1. Optimistically update UI
  addOptimisticItem(item);
  
  // 2. Make API call
  try {
    await api.post('/cart', item);
    // Success - optimistic update becomes real
  } catch (error) {
    // Rollback optimistic update
    toast.error('Failed to add item');
  }
};
```

### 6.2 Cart Item Animations
- ✅ Slide in when added
- ✅ Shake on error
- ✅ Fade out when removed
- ✅ Quantity change animation

---

## 7. Add Skeleton Loaders & Suspense Boundaries

### 7.1 Implement React Suspense
**Files to Update**:
- `src/app/menu/page.tsx`
- `src/app/shop/page.tsx`
- `src/app/order/page.tsx`

**Pattern**:
```typescript
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductGrid categoryId={categoryId} />
</Suspense>
```

### 7.2 Create Skeleton Components

#### ProductCardSkeleton
```typescript
// Shimmer effect
// Placeholder blocks for image, title, price
// Match actual card dimensions
```

#### CategoryPillSkeleton
```typescript
// Animated pill-shaped skeleton
// Random widths for variety
```

#### ProductGridSkeleton
```typescript
// Grid of ProductCardSkeletons
// Responsive columns
```

### 7.3 Streaming SSR
**File**: `src/app/menu/page.tsx`

- Use Server Components where possible
- Stream categories first
- Stream products after
- Progressive enhancement

---

## 8. Error Recovery & Retry Mechanisms

### 8.1 Automatic Retry Logic
**File**: `src/lib/apiClient.ts`

**Features**:
- Exponential backoff (1s, 2s, 4s, 8s)
- Max retry attempts (3)
- Retry only on network errors (not 4xx)
- Cancel pending requests on unmount
- Request deduplication

**Implementation**:
```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status < 500) throw new Error('Client error');
      // Retry on 5xx
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 8.2 Manual Retry UI
- Retry button in error states
- Keyboard shortcut (R to retry)
- Pull-to-refresh on mobile
- Auto-retry with countdown
- Retry with different strategy (fallback API)

### 8.3 Offline Support
**File**: `src/lib/offline.ts`

- Detect offline state
- Queue failed requests
- Sync when back online
- Show offline banner
- Cache critical data in localStorage
- Service Worker for offline pages

### 8.4 Error Monitoring
**File**: `src/lib/errorMonitoring.ts`

- Log errors to Sentry/similar
- Track error frequency
- User context (browser, OS, network)
- Error grouping
- Alert on critical errors

---

## 9. Data Validation & Type Safety

### 9.1 Runtime Validation
**File**: `src/lib/validators.ts`

**Schemas**:
```typescript
// Zod schemas for API responses
const ProductSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  price: z.number().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  available: z.boolean().optional(),
});

// Validate and sanitize API responses
function validateProduct(data: unknown): Product | null {
  const result = ProductSchema.safeParse(data);
  return result.success ? result.data : null;
}
```

### 9.2 Type Guards
```typescript
function isValidProduct(product: any): product is Product {
  return (
    product &&
    typeof product.id === 'string' &&
    (typeof product.price === 'number' || product.price === undefined)
  );
}

function hasImages(product: Product): boolean {
  return Array.isArray(product.images) && product.images.length > 0;
}
```

---

## 10. Performance Optimizations

### 10.1 Memoization
- Memoize expensive computations
- useMemo for filtered/sorted lists
- useCallback for event handlers
- React.memo for components

### 10.2 Virtual Scrolling
**File**: `src/components/VirtualProductGrid.tsx`

- Only render visible products
- Reduce DOM nodes
- Smooth scrolling
- Use `react-virtual` or `react-window`

### 10.3 Image Optimization
- Next.js Image component
- WebP format with fallback
- Responsive images (srcset)
- Lazy loading below fold
- Priority loading above fold
- Blur placeholder

### 10.4 Code Splitting
- Dynamic imports for heavy components
- Route-based splitting
- Component-based splitting
- Lazy load modals/dialogs

---

## 11. Accessibility (a11y)

### 11.1 Error States
- Announce errors to screen readers
- Focus on retry button
- Clear error descriptions
- Keyboard navigation

### 11.2 Loading States
- Announce loading to screen readers
- Show loading progress
- Skip to content link
- Keyboard accessible

### 11.3 Empty States
- Descriptive alt text
- Focus on primary action
- Clear instructions

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Test hooks with various states
- Test error handling
- Test data transformations
- Test null/undefined handling

### 12.2 Integration Tests
- Test API error scenarios
- Test retry logic
- Test optimistic updates
- Test offline behavior

### 12.3 E2E Tests
- Test complete user flows
- Test error recovery
- Test network failures
- Test slow connections

---

## Implementation Order

### Phase 1: Foundation (Priority 1)
1. ✅ Create UI state components (Loading, Error, Empty)
2. ✅ Update hooks with defensive coding
3. ✅ Add image utilities and fallbacks
4. ✅ Create skeleton loaders

### Phase 2: Error Handling (Priority 2)
5. ✅ Implement retry logic in API client
6. ✅ Add error boundaries
7. ✅ Improve error messages
8. ✅ Add manual retry UI

### Phase 3: Optimistic UI (Priority 3)
9. ✅ Implement optimistic cart updates
10. ✅ Add transitions and animations
11. ✅ Add success feedback

### Phase 4: Polish (Priority 4)
12. ✅ Add Suspense boundaries
13. ✅ Implement virtual scrolling
14. ✅ Add offline support
15. ✅ Performance optimizations

---

## Files to Create

1. `src/components/ui/LoadingState.tsx`
2. `src/components/ui/ErrorState.tsx`
3. `src/components/ui/EmptyState.tsx`
4. `src/components/ui/ImageWithFallback.tsx`
5. `src/components/ui/SkeletonLoader.tsx`
6. `src/components/ImageErrorBoundary.tsx`
7. `src/lib/imageUtils.ts`
8. `src/lib/validators.ts`
9. `src/lib/offline.ts`
10. `src/lib/errorMonitoring.ts`
11. `src/components/skeletons/ProductCardSkeleton.tsx`
12. `src/components/skeletons/CategoryPillSkeleton.tsx`
13. `src/components/skeletons/ProductGridSkeleton.tsx`

## Files to Update

1. `src/hooks/useProducts.ts` - Add transitions, isEmpty, defensive checks
2. `src/hooks/useCategories.ts` - Add transitions, isEmpty, defensive checks
3. `src/hooks/useCart.ts` - Add optimistic updates
4. `src/components/DrinkCard.tsx` - Handle optional data, multiple images
5. `src/app/menu/page.tsx` - Add error/empty states, Suspense
6. `src/app/shop/page.tsx` - Similar improvements
7. `src/lib/auth/apiClient.ts` - Add retry logic, timeout handling
8. `src/types/index.ts` - Update interfaces to be more optional

---

## Success Criteria

- ✅ No runtime errors when data is missing/malformed
- ✅ All loading states show skeleton UI
- ✅ All error states have retry buttons
- ✅ All empty states have helpful messages
- ✅ Images always show (with fallback)
- ✅ Cart updates feel instant (optimistic UI)
- ✅ Page loads progressively (Suspense)
- ✅ Works offline (basic functionality)
- ✅ Accessible (keyboard + screen reader)
- ✅ Type-safe (TypeScript strict mode)
- ✅ 95+ Lighthouse score
