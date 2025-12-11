# Comprehensive System Analysis & Data Flow

**Generated:** December 6, 2025  
**Purpose:** Deep understanding of the Elite Coffee system architecture, data flow, and integration points

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Data Flow Analysis](#data-flow-analysis)
3. [Type System & Data Models](#type-system--data-models)
4. [Odoo Integration Deep Dive](#odoo-integration-deep-dive)
5. [Redis Caching Layer](#redis-caching-layer)
6. [Frontend State Management](#frontend-state-management)
7. [Image Handling Pipeline](#image-handling-pipeline)
8. [Error Recovery System](#error-recovery-system)
9. [Critical Issues & Root Causes](#critical-issues--root-causes)
10. [Production Requirements](#production-requirements)

---

## 1. System Architecture Overview

### Tech Stack
```
Frontend:
├── Next.js 15.0.3 (App Router)
├── React 18 (useOptimistic, useTransition)
├── TypeScript (strict mode)
├── TailwindCSS + Custom Elite Design System
└── Lucide Icons

Backend:
├── Next.js API Routes
├── Prisma ORM
├── PostgreSQL (Neon)
├── Redis (Upstash) - Caching & Queue
├── BullMQ - Job Queue
└── NextAuth.js - Authentication

Integrations:
├── Odoo 19 (JSON-RPC)
├── Sentry (Error Tracking)
└── Slack (Alerting)
```

### Layer Architecture
```
┌─────────────────────────────────────────────────────┐
│            Frontend (React Components)              │
│  - Menu Pages, Product Cards, Cart UI              │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│          Custom Hooks (State Management)            │
│  - useProducts(), useCategories(), useCart()        │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│          API Client (Error Recovery)                │
│  - apiClient.get/post/patch/delete                  │
│  - Retry Logic, Exponential Backoff                 │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│            API Routes (Next.js)                     │
│  /api/products, /api/categories, /api/sync/*        │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
┌─────────▼─────────┐  ┌─────────▼──────────┐
│  Redis Cache      │  │  Odoo Client       │
│  - products:all   │  │  - JSON-RPC        │
│  - categories:list│  │  - OdooClient cls  │
│  - sync:etag      │  │  - search_read     │
└───────────────────┘  └────────────────────┘
```

---

## 2. Data Flow Analysis

### Complete Product Sync Flow

```
┌──────────────────────────────────────────────────────────┐
│ Step 1: Trigger Sync                                     │
│ POST /api/sync/products                                  │
│ Authorization: Bearer ADMIN_TOKEN                        │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 2: Odoo Client Authenticates                       │
│ - Calls /jsonrpc with common.authenticate                │
│ - Stores uid for subsequent requests                     │
│ - Reuses uid for session                                 │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 3: Fetch Products from Odoo                        │
│ Model: product.product                                   │
│ Method: search_read                                      │
│ Fields: [                                                │
│   'id', 'name', 'default_code', 'list_price',           │
│   'categ_id', 'active', 'sale_ok',                      │
│   'image_128', 'image_1024', 'image_1920',              │
│   'uom_id', 'taxes_id', 'product_tmpl_id'               │
│ ]                                                         │
│ Domain: [['sale_ok', '=', true]]                        │
│                                                           │
│ ⚠️ MISSING FIELDS:                                       │
│   - description / description_sale                       │
│   - qty_available / virtual_available                    │
│   - attribute_line_ids (variants)                        │
│   - sequence (sort order)                                │
│   - website_published                                    │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 4: Fetch Product Templates (for missing images)    │
│ Model: product.template                                  │
│ Method: search_read                                      │
│ Reason: product.product.image_* can be false             │
│ Fallback: Use template.image_* if product has none       │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 5: Transform to Frontend Format                    │
│                                                           │
│ For each product:                                        │
│   - Extract images (image_1024 → base64 data URI)       │
│   - Check template fallback if product.image_* is false  │
│   - Convert to: data:image/png;base64,{base64}          │
│   - Filter out false/null images                         │
│   - Build images array                                   │
│                                                           │
│ Result:                                                   │
│ {                                                         │
│   id: string,                                            │
│   title: string (from name),                             │
│   price: number (from list_price),                       │
│   categoryId: string (from categ_id[0]),                 │
│   categoryName: string (from categ_id[1]),               │
│   available: boolean (from active && sale_ok),           │
│   images: string[] (base64 data URIs),                   │
│   sku: string (from default_code),                       │
│   uom: { id, name },                                     │
│   taxes: number[]                                        │
│ }                                                         │
│                                                           │
│ ⚠️ ISSUE: All products showing images: []                │
│   - Odoo fields returning false instead of base64?       │
│   - Template lookup not finding images?                  │
│   - Image processing failing silently?                   │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 6: Fetch Categories from Odoo                      │
│ Model: product.category                                  │
│ Fields: ['id', 'name', 'parent_id']                     │
│                                                           │
│ ⚠️ MISSING FIELDS:                                       │
│   - display_name                                         │
│   - complete_name                                        │
│   - product_count                                        │
│   - image (category images)                              │
│   - description                                          │
│   - sequence                                             │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 7: Store in Redis Cache                            │
│                                                           │
│ Keys:                                                     │
│   products:all → Product[] (245 products)                │
│   categories:list → Category[] (14 categories)           │
│   sync:last_update → ISO timestamp                       │
│   sync:etag → SHA-256 hash                               │
│   products:list:1:50:all → Paginated summary             │
│                                                           │
│ TTL: None (persistent until next sync)                   │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Step 8: Return Success Response                         │
│ {                                                         │
│   success: true,                                         │
│   data: {                                                │
│     products: 245,                                       │
│     categories: 14,                                      │
│     lastUpdate: "2025-12-06T15:42:50.649Z",             │
│     etag: "sha256hash"                                   │
│   }                                                       │
│ }                                                         │
└──────────────────────────────────────────────────────────┘
```

### Frontend Product Fetch Flow

```
┌──────────────────────────────────────────────────────────┐
│ User opens Menu Page                                     │
│ /menu or /menu?category=coffee                           │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ useCategories() Hook Initializes                        │
│ - Sets loading: true                                     │
│ - Calls apiClient.get("/api/categories")                │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ useProducts() Hook Initializes                          │
│ - Sets loading: true                                     │
│ - Calls apiClient.get("/api/products?categoryId=...")   │
└────────────────────┬─────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼─────────┐  ┌────────▼────────┐
│ GET /api/categories│  │ GET /api/products│
│                    │  │                  │
│ 1. Read Redis     │  │ 1. Read Redis    │
│    categories:list│  │    products:all  │
│                    │  │                  │
│ 2. If null →      │  │ 2. If null →     │
│    Return 503     │  │    Return 503    │
│    "cache empty"  │  │    "cache empty" │
│                    │  │                  │
│ 3. Return:        │  │ 3. Filter by:    │
│   {               │  │    - categoryId  │
│     categories,   │  │    - search      │
│     lastUpdate,   │  │    - available   │
│     count         │  │                  │
│   }               │  │ 4. Paginate      │
│                    │  │                  │
│                    │  │ 5. Return:       │
│                    │  │   {              │
│                    │  │     items,       │
│                    │  │     total,       │
│                    │  │     page,        │
│                    │  │     pageSize,    │
│                    │  │     lastUpdate   │
│                    │  │   }              │
└───────────┬────────┘  └────────┬─────────┘
            │                    │
┌───────────▼────────────────────▼─────────────────────────┐
│ Error Handling in Hooks                                  │
│                                                           │
│ If 503 or "cache is empty":                              │
│   - Set error: "Catalog is being synchronized..."        │
│   - Frontend shows friendly message                      │
│                                                           │
│ ⚠️ CRITICAL ISSUE HERE:                                  │
│   Menu page checks:                                      │
│   USE_FALLBACK = error?.includes("503") ||               │
│                  error?.includes("cache is empty")       │
│                                                           │
│   if (USE_FALLBACK) {                                    │
│     return getAllCategories(); // Static menuData.ts!    │
│   }                                                       │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ Menu Page Receives Data                                  │
│                                                           │
│ TWO POSSIBLE SOURCES:                                    │
│                                                           │
│ A) DYNAMIC (from Odoo):                                  │
│    - apiCategories (14 categories from Redis)            │
│    - apiProducts (245 products from Redis)               │
│    - Maps products to categories                         │
│    - Sanitizes images with sanitizeImages()              │
│    - Converts title → name for DrinkCard                 │
│                                                           │
│ B) STATIC FALLBACK (menuData.ts):                        │
│    - getAllCategories() returns hardcoded menu           │
│    - 3 categories with ~30 items                         │
│    - Prices, images, descriptions all static             │
│    - ⚠️ COMPLETELY IGNORES ODOO DATA                     │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│ DrinkCard Component Renders                             │
│                                                           │
│ Props (defensive):                                       │
│   - id?: string                                          │
│   - name?: string                                        │
│   - description?: string                                 │
│   - price?: number                                       │
│   - images?: string[]                                    │
│   - available?: boolean                                  │
│                                                           │
│ Image Handling:                                          │
│   1. sanitizeImages(images) → filters null/invalid       │
│   2. ImageWithFallback component:                        │
│      - Tries base64 first (data:image/...)               │
│      - Falls back to URL                                 │
│      - Shows placeholder if all fail                     │
│      - Auto-rotates multiple images (3s interval)        │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Type System & Data Models

### Frontend Types

#### Product Type (Multiple Definitions - INCONSISTENCY!)

**Location 1: `/src/hooks/useProducts.ts`**
```typescript
export interface Product {
  id: string;
  title: string;              // ⚠️ Named "title"
  description?: string;
  price: number;
  categoryId?: string;
  categoryName?: string;
  images?: string[];
  available?: boolean;
  sku?: string;
  attributes?: Record<string, any>;
  uom?: { id: number; name: string };
  taxes?: number[];
}
```

**Location 2: `/src/app/api/products/route.ts`**
```typescript
type Product = {
  id: string;
  title: string;              // ⚠️ Same naming
  description: string | null;
  price: number;
  categoryId: string;
  categoryName?: string;
  images: string[];
  available: boolean;
  sku?: string;
  uom?: { id: number; name: string };
  taxes?: number[];
};
```

**Location 3: `/src/lib/menuData.ts` (Static Data)**
```typescript
export interface MenuItem {
  id: string;
  name: string;               // ⚠️ Named "name" instead!
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
```

**Location 4: `/src/components/DrinkCard.tsx`**
```typescript
interface DrinkCardProps {
  id?: string;
  name?: string;              // ⚠️ Expects "name"
  description?: string;
  price?: number;
  images?: string[];
  available?: boolean;
  onAddToCart?: () => void;
  className?: string;
}
```

**🚨 CRITICAL ISSUE:**
- API returns `title`
- Static data uses `name`
- DrinkCard expects `name`
- Menu page manually maps: `name: p.title` (line 83)

### Category Type

**Location: `/src/hooks/useCategories.ts`**
```typescript
export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  image?: string;
}
```

**Currently Synced from Odoo:**
```typescript
{
  id: string,          // categ_id[0]
  name: string,        // categ_id[1]
  parent_id?: number   // ❌ Synced but not used
}
```

**Missing Fields:**
- `description`
- `productCount` (calculated on frontend)
- `image` (category images)
- `sequence` (display order)
- `display_name` (full path)
- `complete_name` (hierarchy)

### Odoo Data Types

**Product Record from Odoo:**
```typescript
type ProductRecord = {
  id: number;
  name: string;
  default_code?: string;      // SKU
  list_price: number;
  categ_id: [number, string]; // [id, name]
  active: boolean;
  sale_ok: boolean;
  image_128?: string | boolean;   // Base64 or false
  image_1024?: string | boolean;  // Base64 or false
  image_1920?: string | boolean;  // Base64 or false
  uom_id: [number, string];
  taxes_id: number[];
  product_tmpl_id: [number, string];
};
```

**Product Template Record:**
```typescript
type ProductTemplateRecord = {
  id: number;
  name: string;
  image_128?: string | boolean;
  image_1024?: string | boolean;
  image_1920?: string | boolean;
};
```

**Category Record from Odoo:**
```typescript
type CategoryRecord = {
  id: number;
  name: string;
  parent_id?: [number, string] | false;
};
```

---

## 4. Odoo Integration Deep Dive

### OdooClient Class Architecture

**File:** `/src/server/utils/odooClient.ts` (560 lines)

#### Authentication Flow
```typescript
class OdooClient {
  private axios: AxiosInstance;
  private config: OdooConfig;
  private uid: number | null = null;  // Cached user ID

  private async authenticate(): Promise<number> {
    // Reuse cached uid if available
    if (this.uid) return this.uid;

    // JSON-RPC authentication
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [db, username, password, {}]
      }
    };

    const { data } = await this.axios.post("/jsonrpc", payload);
    this.uid = data.result;
    return this.uid;
  }
}
```

#### Generic RPC Method
```typescript
private async rpc<T>(
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await this.authenticate();
  
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [db, uid, password, model, method, args, kwargs]
    }
  };

  const { data } = await this.axios.post("/jsonrpc", payload);
  return data.result;
}
```

#### Search Read Helper
```typescript
async searchRead<T>(
  model: string,
  domain: any[] = [],
  fields?: string[],
  kwargs: Record<string, unknown> = {}
): Promise<T[]> {
  return this.rpc<T[]>(
    model,
    "search_read",
    [domain],
    { ...(fields ? { fields } : {}), ...kwargs }
  );
}
```

### Current Sync Implementation

**File:** `/src/app/api/sync/products/route.ts`

#### Fields Being Synced
```typescript
const productFields = [
  "id",
  "name",
  "default_code",      // SKU
  "list_price",
  "categ_id",
  "active",
  "sale_ok",
  "image_128",         // Thumbnail
  "image_1024",        // Medium
  "image_1920",        // Large
  "uom_id",            // Unit of measure
  "taxes_id",          // Tax IDs
  "product_tmpl_id"    // Template reference
];

const categoryFields = [
  "id",
  "name",
  "parent_id"
];
```

#### Image Extraction Logic
```typescript
// Try product images first
const image1024 = (rec.image_1024 && typeof rec.image_1024 === 'string') 
  ? rec.image_1024 
  : (template?.image_1024 && typeof template.image_1024 === 'string') 
    ? template.image_1024 
    : null;

const image1920 = (rec.image_1920 && typeof rec.image_1920 === 'string')
  ? rec.image_1920
  : (template?.image_1920 && typeof template.image_1920 === 'string')
    ? template.image_1920
    : null;

const image128 = (rec.image_128 && typeof rec.image_128 === 'string')
  ? rec.image_128
  : (template?.image_128 && typeof template.image_128 === 'string')
    ? template.image_128
    : null;

// Build images array
const images: string[] = [];
if (image1920) images.push(`data:image/png;base64,${image1920}`);
if (image1024 && image1024 !== image1920) {
  images.push(`data:image/png;base64,${image1024}`);
}
if (image128 && image128 !== image1024 && image128 !== image1920) {
  images.push(`data:image/png;base64,${image128}`);
}
```

**🚨 RESULT: All products have `images: []`**

**Possible Causes:**
1. Odoo fields returning `false` instead of base64 strings
2. Images not set in Odoo product records
3. Template fallback not finding images
4. Silent failures in image processing

### Fields NOT Being Synced (GAPS)

#### Product Fields Missing:
```typescript
// Descriptions
"description"           // Internal notes
"description_sale"      // Customer-facing description

// Stock & Availability
"qty_available"         // On-hand quantity
"virtual_available"     // Forecasted quantity
"outgoing_qty"
"incoming_qty"

// Variants & Attributes
"attribute_line_ids"    // Product variants (size, color, etc.)
"product_variant_ids"
"product_variant_count"

// Display & Sorting
"sequence"              // Sort order
"priority"              // Featured products

// Website
"website_published"     // Published on website
"website_ribbon_id"     // Badge/ribbon
"website_sequence"      // Website display order
"website_description"   // SEO description

// Additional Info
"barcode"               // Product barcode
"weight"                // Shipping weight
"volume"                // Shipping volume
```

#### Category Fields Missing:
```typescript
"display_name"          // Full category path
"complete_name"         // Hierarchy (Parent / Child)
"product_count"         // Number of products
"image"                 // Category image/icon
"description"           // Category description
"sequence"              // Display order
"parent_path"           // Full hierarchy path
```

---

## 5. Redis Caching Layer

### Cache Structure

**File:** `/src/server/cache/redis.ts`

#### Keys Used:
```
products:all              → Product[] (full list)
categories:list           → Category[]
sync:last_update          → ISO timestamp string
sync:etag                 → SHA-256 hash
products:list:1:50:all    → Product[] (paginated summary)
```

#### Redis Operations:
```typescript
export async function redisGet<T>(key: string): Promise<T | null> {
  const c = await ensureConnected();
  const val = await c.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const c = await ensureConnected();
  const payload = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await c.setEx(key, ttlSeconds, payload);
  } else {
    await c.set(key, payload);  // No TTL = persistent
  }
}
```

**Cache Invalidation:**
- Manual: Run `/api/sync/products` (requires ADMIN_TOKEN)
- No automatic invalidation
- No TTL set (data persists forever)
- No webhooks from Odoo

**🚨 ISSUE:** If cache is empty and sync fails, frontend falls back to static data

---

## 6. Frontend State Management

### Custom Hooks Architecture

#### useProducts Hook

**File:** `/src/hooks/useProducts.ts` (172 lines)

```typescript
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { categoryId, search, available, autoFetch = true } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (categoryId) params.append("categoryId", categoryId);
      if (search) params.append("search", search);
      if (available !== undefined) params.append("available", String(available));

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiClient.get<ProductsResponse>(url);
      
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setProducts(response.items || []);
        setLastUpdate(response.lastUpdate || null);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      
      // User-friendly error messages
      if (errorMessage.includes("503") || errorMessage.includes("cache is empty")) {
        setError("Product catalog is being synchronized. Please try again in a moment.");
      } else if (errorMessage.includes("Network") || errorMessage.includes("Failed to fetch")) {
        setError("Unable to connect. Please check your internet connection.");
      } else if (errorMessage.includes("timeout")) {
        setError("Request timed out. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, search, available]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    products,
    loading,
    error,
    lastUpdate,
    refetch: fetchProducts,
    getProductById: (id) => products.find(p => p?.id === id),
    isEmpty: !loading && !error && products.length === 0,
    isRefetching: isPending
  };
}
```

**Features:**
- ✅ useTransition for non-blocking updates
- ✅ Defensive null checking
- ✅ User-friendly error messages
- ✅ isEmpty flag for empty states
- ✅ Refetch capability
- ❌ No cache invalidation on mutations
- ❌ No optimistic updates for products

#### useCategories Hook

**File:** `/src/hooks/useCategories.ts` (107 lines)

Similar structure to useProducts:
- useTransition for state updates
- Error classification
- isEmpty flag
- getCategoryById helper

#### useCart Hook (Optimistic Updates)

**File:** `/src/hooks/useCart.ts`

```typescript
export function useCart() {
  const [cart, setCart] = useState<CartState>({ items: [] });
  const [optimisticCart, setOptimisticCart] = useOptimistic(
    cart,
    (state, newState: CartState) => newState
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const addToCart = async (item: CartItem) => {
    // Optimistic update
    const newCart = {
      items: [...optimisticCart.items, item]
    };
    startTransition(() => {
      setOptimisticCart(newCart);
    });
    setIsUpdating(true);

    try {
      const response = await apiClient.post("/api/cart", newCart);
      setCart(response);  // Confirm with server response
    } catch (error) {
      // Revert optimistic update on error
      console.error("Failed to add to cart:", error);
      // Cart automatically reverts to last confirmed state
    } finally {
      setIsUpdating(false);
    }
  };

  // Similar for removeFromCart, updateQuantity
}
```

**Features:**
- ✅ useOptimistic for instant UI updates
- ✅ Auto-revert on errors
- ✅ isUpdating flag for loading states
- ✅ 0ms perceived delay

---

## 7. Image Handling Pipeline

### ImageWithFallback Component

**File:** `/src/components/ui/ImageWithFallback.tsx` (182 lines)

#### Features:
```typescript
- Multiple image support (auto-rotate every 3s)
- Base64 detection (data:image/...)
- Fallback chain: src → fallbackSrc → placeholder
- Loading states with shimmer
- Error states with icon
- Dots indicator for multiple images
- Next.js Image optimization for URLs
- Native <img> for base64
```

#### Implementation:
```typescript
export default function ImageWithFallback({
  src,  // string | string[]
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  width,
  height,
  className,
  fill = false,
  priority = false,
  objectFit = "cover",
  showErrorIcon = true,
  onError,
  onLoad
}: ImageWithFallbackProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle array of images
  const images = Array.isArray(src) ? src : src ? [src] : [];
  const currentSrc = images[currentImageIndex];

  // Auto-rotate images
  useEffect(() => {
    if (images.length > 1 && !imageError) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [images.length, imageError]);

  // Render base64 or URL
  const isBase64 = currentSrc?.startsWith("data:");
  
  if (isBase64) {
    return <img src={currentSrc} ... />;  // Native img for base64
  } else {
    return <Image src={currentSrc} ... />;  // Next.js Image for URLs
  }
}
```

### Image Utilities

**File:** `/src/lib/imageUtils.ts` (134 lines)

```typescript
export function isValidImage(src: string | undefined | null): boolean {
  if (!src || typeof src !== 'string') return false;
  
  // Check if base64
  if (src.startsWith('data:image/')) return true;
  
  // Check if URL
  try {
    new URL(src);
    return true;
  } catch {
    // Check if relative path
    return src.startsWith('/') || src.startsWith('./');
  }
}

export function sanitizeImages(
  images: (string | undefined | null)[] | undefined | null
): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.filter((img): img is string => isValidImage(img));
}

export function getFirstValidImage(
  images: (string | undefined | null)[] | undefined | null,
  fallback?: string
): string {
  const validImage = images?.find(img => isValidImage(img));
  return validImage || fallback || getFallbackImage('product');
}
```

**Usage in DrinkCard:**
```typescript
const sanitizedImages = sanitizeImages(images);

<ImageWithFallback
  src={sanitizedImages}  // Array of base64 or URLs
  alt={name || "Product"}
  fallbackSrc="/images/placeholder.svg"
  className="..."
  priority={false}
/>
```

---

## 8. Error Recovery System

### Retry Logic with Exponential Backoff

**File:** `/src/lib/errorRecovery.ts` (313 lines)

#### Error Classification:
```typescript
export function classifyError(error: unknown): ErrorInfo {
  // Network errors → retryable
  if (error instanceof TypeError && 
      error.message.includes("fetch")) {
    return {
      type: "network",
      isRetryable: true,
      message: "Network connection lost..."
    };
  }

  // Timeout errors → retryable
  if (error.name === "AbortError" || 
      error.message.includes("timeout")) {
    return {
      type: "timeout",
      isRetryable: true,
      message: "Request timed out..."
    };
  }

  // Server errors (5xx) → retryable
  if (status >= 500) {
    return {
      type: "server",
      isRetryable: true,
      message: "Server error..."
    };
  }

  // Client errors (4xx) → not retryable (except 408, 429)
  if (status >= 400) {
    return {
      type: "client",
      isRetryable: status === 408 || status === 429,
      message: "..."
    };
  }
}
```

#### Retry Implementation:
```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorInfo = classifyError(error);
      
      // Don't retry if not retryable
      if (!errorInfo.isRetryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate backoff delay
      const delay = getBackoffDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffFactor
      );
      
      onRetry?.(attempt + 1, error as Error);
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  throw lastError!;
}
```

#### Backoff Calculation:
```typescript
function getBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number
): number {
  const delay = initialDelay * Math.pow(backoffFactor, attempt);
  return Math.min(delay, maxDelay);
}

// Example:
// Attempt 0: 1000ms
// Attempt 1: 2000ms (1000 * 2^1)
// Attempt 2: 4000ms (1000 * 2^2)
// Attempt 3: 8000ms (1000 * 2^3)
// Capped at maxDelay (10000ms)
```

### API Client Integration

**File:** `/src/lib/auth/apiClient.ts`

```typescript
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export const apiClient = {
  async get<T>(
    url: string,
    options?: RequestInit,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return withRetry(
      async () => {
        const response = await authFetch(url, { ...options, method: "GET" });
        
        if (!response.ok) {
          throw new ApiError(response.status, await response.text());
        }
        
        const data = await response.json();
        return data.data || data;
      },
      { ...DEFAULT_RETRY_OPTIONS, ...retryOptions }
    );
  }
  // Similar for post, patch, delete
};
```

**Features:**
- ✅ Auto-retry on 5xx errors
- ✅ Exponential backoff
- ✅ Configurable per request
- ✅ Network error detection
- ✅ Timeout handling

---

## 9. Critical Issues & Root Causes

### Issue 1: Static Fallback System

**Location:** `/src/app/menu/page.tsx` (lines 52-58)

**Problem:**
```typescript
const USE_FALLBACK = error?.includes("503") || error?.includes("cache is empty");

if (USE_FALLBACK) {
  return getAllCategories();  // Returns static menuData.ts
}
```

**Impact:**
- When Redis cache is empty → Shows static data
- When sync fails → Shows static data
- Odoo changes don't reflect → Shows static data
- Defeats entire purpose of Odoo integration

**Root Cause:**
- Originally added for development convenience
- Never removed for production
- No clear distinction between dev/prod modes

**Solution Required:**
- Remove fallback logic
- Show proper empty state instead
- Guide users to run sync
- Add admin UI for sync

### Issue 2: Missing Product Fields

**Problem:**
Only syncing 13 fields, missing critical data:

```typescript
// Currently synced ✅
id, name, default_code, list_price, categ_id, 
active, sale_ok, image_128, image_1024, image_1920, 
uom_id, taxes_id, product_tmpl_id

// Missing ❌
description_sale       → All products have description: null
attribute_line_ids     → No variant support
qty_available          → No stock levels
sequence               → No custom ordering
website_published      → Can't hide products
```

**Impact:**
- Products show with no description
- No size/flavor variants
- No stock availability
- Can't feature products
- Can't control visibility

**Root Cause:**
- Minimal sync implementation
- Focused on basic functionality
- Never expanded to full feature set

**Solution Required:**
- Expand `productFields` array
- Add variant extraction logic
- Include stock calculations
- Add website-specific fields

### Issue 3: Zero Images

**Problem:**
All 245 products return `images: []`

**Curl Test Result:**
```json
{
  "id": "609",
  "title": "Americano",
  "description": null,
  "price": 70,
  "available": true,
  "images": []
}
```

**Current Image Logic:**
```typescript
// Check if image fields have base64
const image1024 = (rec.image_1024 && typeof rec.image_1024 === 'string') 
  ? rec.image_1024 
  : (template?.image_1024 && typeof template.image_1024 === 'string') 
    ? template.image_1024 
    : null;

// Result: image1024 = null for all products
```

**Possible Causes:**
1. **Odoo fields returning `false`:** Fields exist but are boolean `false` instead of base64
2. **Images not uploaded:** Products in Odoo database have no images
3. **Field naming mismatch:** Using wrong field names
4. **Permission issue:** API key doesn't have image access
5. **Template lookup failing:** product_tmpl_id not matching

**Root Cause Investigation Needed:**
```bash
# Direct Odoo check required:
1. Log into Odoo UI
2. Check product "Americano" (ID 609)
3. Verify if image exists in "Image" field
4. Check product.template record
5. Verify field names (image_1024 vs image_medium)
```

**Solution Required:**
- Investigate Odoo data directly
- Check field naming in Odoo 19
- Verify image storage format
- Add debug logging in sync
- Test with one known-good product

### Issue 4: Type Inconsistency (title vs name)

**Problem:**
```typescript
// API returns
{ title: "Americano", ... }

// DrinkCard expects
{ name: "Americano", ... }

// Menu page manually maps
{
  name: p.title,  // Line 83
  ...
}
```

**Impact:**
- Manual mapping required
- Type safety lost
- Potential bugs if mapping forgotten
- Confusing codebase

**Root Cause:**
- Backend used "title" to differentiate from menuData's "name"
- Never unified type system
- Frontend expects "name" from legacy static data

**Solution Required:**
- Standardize on one naming convention
- Update Product interface
- Update all transformations
- Remove manual mapping

### Issue 5: Incomplete Category Data

**Problem:**
Only syncing 3 fields:
```typescript
categoryFields = ["id", "name", "parent_id"]
```

Missing:
- `description` → No category descriptions
- `image` → No category icons
- `sequence` → Random order
- `product_count` → Unknown product counts
- `display_name` → No hierarchy display

**Impact:**
- Categories show generic
- No visual hierarchy
- Can't sort meaningfully
- Product counts calculated on frontend (expensive)

**Root Cause:**
- Minimal implementation
- Backend calculates counts in real-time

**Solution Required:**
- Expand category fields
- Include hierarchy info
- Add category images
- Optimize product counting

---

## 10. Production Requirements

### Must-Have Features

#### 1. Remove Static Fallback
```typescript
// REMOVE THIS:
if (USE_FALLBACK) {
  return getAllCategories();
}

// REPLACE WITH:
if (!loading && (categoriesEmpty || productsEmpty)) {
  return (
    <EmptyState
      variant="no-products"
      title="Catalog Not Synced"
      description="The product catalog needs to be synchronized from Odoo."
      actionLabel="Contact Admin"
      onAction={() => window.location.href = "/contact"}
    />
  );
}
```

#### 2. Expand Sync Fields
```typescript
const productFields = [
  // Current ✅
  "id", "name", "default_code", "list_price", "categ_id",
  "active", "sale_ok", "image_128", "image_1024", "image_1920",
  "uom_id", "taxes_id", "product_tmpl_id",
  
  // Add ⭐
  "description_sale",      // Customer description
  "qty_available",         // Stock level
  "virtual_available",     // Forecasted stock
  "attribute_line_ids",    // Variants
  "sequence",              // Sort order
  "website_published",     // Visibility
  "website_sequence",      // Website order
  "barcode",               // SKU barcode
  "weight",                // Shipping
  "volume"                 // Shipping
];

const categoryFields = [
  // Current ✅
  "id", "name", "parent_id",
  
  // Add ⭐
  "display_name",          // Full path
  "complete_name",         // Hierarchy
  "image",                 // Icon/image
  "description",           // Description
  "sequence",              // Sort order
  "product_count"          // Number of products
];
```

#### 3. Fix Image Handling
```typescript
// Add debug logging
console.log("Product images:", {
  id: rec.id,
  name: rec.name,
  image_128: typeof rec.image_128,
  image_1024: typeof rec.image_1024,
  image_1920: typeof rec.image_1920,
  template_id: rec.product_tmpl_id,
  template_image_1024: typeof template?.image_1024
});

// Try different image fields
const imageFields = [
  "image",           // Main image (might be actual field name)
  "image_medium",    // Medium size
  "image_small",     // Small size
  "image_1920",
  "image_1024",
  "image_128"
];

// Check Odoo field naming in v19
```

#### 4. Standardize Data Types
```typescript
// Single source of truth
export interface Product {
  // Standardize on "name" (matches Odoo)
  id: string;
  name: string;           // Changed from title
  description: string | null;
  price: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  available: boolean;
  sku: string | null;
  stock: number | null;   // Add stock
  variants: ProductVariant[] | null;  // Add variants
  sequence: number;       // Add sequence
  attributes: Record<string, any>;
  uom: { id: number; name: string };
  taxes: number[];
}

// Update all references
// Remove manual mapping in menu page
```

#### 5. Add Admin Sync UI
```typescript
// /app/admin/sync/page.tsx
export default function AdminSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await apiClient.post("/api/sync/products", {}, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`
        }
      });
      setResult(response);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <button onClick={handleSync} disabled={syncing}>
        {syncing ? "Syncing..." : "Sync Products from Odoo"}
      </button>
      {result && <SyncResultDisplay result={result} />}
    </div>
  );
}
```

#### 6. Add Webhooks (Optional)
```typescript
// /app/api/webhooks/odoo/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get("x-odoo-signature");
  
  // Verify signature
  if (!verifyOdooSignature(signature, await req.text())) {
    return jsonResponse(errorResponse("Invalid signature"), 401);
  }

  const { model, operation, record_id } = await req.json();

  if (model === "product.product" || model === "product.category") {
    // Trigger incremental sync
    await triggerIncrementalSync(model, record_id);
  }

  return jsonResponse(successResponse({}, "Webhook processed"));
}
```

---

## Summary of Key Findings

### What's Working ✅
1. **Odoo Connection:** Successfully authenticating and fetching data
2. **Redis Caching:** Storing 245 products, 14 categories
3. **API Routes:** Products and categories endpoints functional
4. **Error Recovery:** Retry logic, exponential backoff working
5. **Optimistic UI:** Cart updates instant with auto-revert
6. **Type Safety:** TypeScript throughout
7. **Image Component:** Handles base64, fallbacks, multiple images

### Critical Blockers 🚨
1. **Static Fallback:** Defeats Odoo integration purpose
2. **Zero Images:** All products showing empty images array
3. **Missing Fields:** No descriptions, variants, stock, etc.
4. **Type Mismatch:** title vs name inconsistency
5. **No Admin UI:** Must use curl for sync

### Production Gaps 📋
1. **No Cache Invalidation:** Manual sync only
2. **No Webhooks:** No real-time updates from Odoo
3. **Limited Category Data:** Missing hierarchy, images, counts
4. **No Incremental Sync:** Full sync every time (slow at scale)
5. **No Stock Display:** Can't show availability
6. **No Variant Support:** All products single variant

### Next Steps
1. **Day 1:** Remove static fallback, fix type naming
2. **Day 2:** Investigate image issue, expand sync fields
3. **Day 3:** Add admin sync UI, test thoroughly
4. **Day 4:** Implement incremental sync, webhooks
5. **Day 5:** Add stock display, variant support
6. **Day 6:** Performance optimization, caching strategy

---

**End of Comprehensive Analysis**
