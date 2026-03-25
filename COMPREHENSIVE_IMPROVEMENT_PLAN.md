
# ELITE Coffee Shop - Comprehensive Improvement Plan

**Generated:** 2026-03-24  
**Project:** ELITE Coffee Shop E-Commerce Platform  
**Current Status:** Production-ready with room for optimization

---

## Executive Summary

Your ELITE Coffee Shop application is well-architected with solid foundations in Next.js 15, Prisma, Redis, and Odoo integration. After comprehensive analysis of the codebase, I've identified **47 specific improvements** across 8 categories that will enhance performance, security, maintainability, and user experience.

**Priority Distribution:**
- 🔴 **Critical (P0):** 8 items - Security & Performance
- 🟠 **High (P1):** 15 items - Architecture & Reliability  
- 🟡 **Medium (P2):** 14 items - Code Quality & UX
- 🟢 **Low (P3):** 10 items - Nice-to-have Enhancements

---

## Table of Contents

1. [Architecture & Performance](#1-architecture--performance)
2. [Security Enhancements](#2-security-enhancements)
3. [Database & Data Layer](#3-database--data-layer)
4. [API Design & Backend](#4-api-design--backend)
5. [Frontend & User Experience](#5-frontend--user-experience)
6. [Testing & Quality Assurance](#6-testing--quality-assurance)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Code Quality & Maintainability](#8-code-quality--maintainability)

---

## 1. Architecture & Performance

### 🔴 P0: Implement API Response Caching Strategy
**Current Issue:** Every API request hits the database/Redis, even for frequently accessed data.

**Impact:** High - Reduces server load by 40-60% and improves response times

**Solution:**
```typescript
// src/lib/apiCache.ts - Enhance existing cache
export class ApiCache {
  private static cache = new Map<string, { data: any; expires: number }>();
  
  static async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, { data, expires: Date.now() + ttl * 1000 });
    return data;
  }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  return ApiCache.get(
    `products:${categoryId}`,
    () => fetchProductsFromDB(categoryId),
    300 // 5 minutes
  );
}
```

**Files to Update:**
- [`src/lib/apiCache.ts`](src/lib/apiCache.ts) - Enhance with TTL and invalidation
- [`src/app/api/products/route.ts`](src/app/api/products/route.ts:95)
- [`src/app/api/categories/route.ts`](src/app/api/categories/route.ts:30)

---

### 🟠 P1: Optimize Redis Connection Pooling
**Current Issue:** Single Redis client may bottleneck under high load.

**Impact:** Medium - Improves concurrent request handling

**Solution:**
```typescript
// src/server/cache/redis.ts
import { createClient, type RedisClientType } from "redis";

class RedisPool {
  private pool: RedisClientType[] = [];
  private readonly poolSize = 5;
  
  async getClient(): Promise<RedisClientType> {
    // Round-robin or least-busy selection
    return this.pool[Math.floor(Math.random() * this.poolSize)];
  }
  
  async initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      const client = createClient({ url: process.env.REDIS_URL });
      await client.connect();
      this.pool.push(client);
    }
  }
}
```

**Files to Update:**
- [`src/server/cache/redis.ts`](src/server/cache/redis.ts:1-139)

---

### 🟠 P1: Implement Database Connection Pooling
**Current Issue:** Prisma client may create too many connections in serverless.

**Impact:** Medium - Prevents connection exhaustion

**Solution:**
```typescript
// src/server/db/client.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pooling
  __internal: {
    engine: {
      connection_limit: 10, // Adjust based on your plan
    },
  },
});
```

**Files to Update:**
- [`src/server/db/client.ts`](src/server/db/client.ts:1-15)

---

### 🟡 P2: Add Image Optimization Pipeline
**Current Issue:** Product images are served without optimization.

**Impact:** Medium - Reduces bandwidth by 60-80%

**Solution:**
```typescript
// next.config.js
module.exports = withNextIntl({
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [/* existing patterns */],
  },
});
```

**Files to Update:**
- [`next.config.js`](next.config.js:1-46)
- Create `src/components/OptimizedImage.tsx`

---

### 🟡 P2: Implement Request Deduplication
**Current Issue:** Multiple components may trigger identical API requests.

**Impact:** Low-Medium - Reduces redundant network calls

**Solution:**
```typescript
// src/lib/requestDeduplication.ts
const pendingRequests = new Map<string, Promise<any>>();

export async function dedupedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}
```

---

## 2. Security Enhancements

### 🔴 P0: Add CSRF Protection for State-Changing Operations
**Current Issue:** No CSRF tokens for POST/PATCH/DELETE operations.

**Impact:** Critical - Prevents cross-site request forgery attacks

**Solution:**
```typescript
// middleware.ts - Add CSRF middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Existing middleware logic...
  
  // Add CSRF protection for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('next-auth.csrf-token');
    
    if (!csrfToken || csrfToken !== sessionToken?.value) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}
```

**Files to Update:**
- [`middleware.ts`](middleware.ts)
- Add CSRF token generation in auth flow

---

### 🔴 P0: Implement Rate Limiting Per Endpoint
**Current Issue:** Global rate limiting exists but not per-endpoint.

**Impact:** Critical - Prevents API abuse and DDoS

**Solution:**
```typescript
// src/server/utils/rateLimit.ts - Enhance existing
export const rateLimiters = {
  auth: createRateLimiter({ points: 5, duration: 3600 }), // 5/hour
  cart: createRateLimiter({ points: 100, duration: 60 }), // 100/min
  orders: createRateLimiter({ points: 10, duration: 60 }), // 10/min
  products: createRateLimiter({ points: 200, duration: 60 }), // 200/min
};

// Usage in API routes
export async function POST(request: NextRequest) {
  await rateLimiters.orders.consume(userId);
  // ... rest of handler
}
```

**Files to Update:**
- [`src/server/utils/rateLimit.ts`](src/server/utils/rateLimit.ts)
- Apply to all API routes

---

### 🟠 P1: Add Input Sanitization Layer
**Current Issue:** User inputs are validated but not sanitized.

**Impact:** High - Prevents XSS and injection attacks

**Solution:**
```typescript
// src/lib/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML allowed
    ALLOWED_ATTR: [],
  });
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  return sanitized;
}
```

**Dependencies to Add:**
```bash
npm install isomorphic-dompurify
```

---

### 🟠 P1: Implement API Key Rotation System
**Current Issue:** Odoo API keys are static and never rotated.

**Impact:** High - Reduces risk of compromised credentials

**Solution:**
```typescript
// src/server/utils/apiKeyRotation.ts
export class ApiKeyManager {
  private static keys: Map<string, { key: string; expires: Date }> = new Map();
  
  static async getActiveKey(service: string): Promise<string> {
    const cached = this.keys.get(service);
    if (cached && cached.expires > new Date()) {
      return cached.key;
    }
    
    // Fetch new key from secure storage (e.g., AWS Secrets Manager)
    const newKey = await this.fetchFromSecureStorage(service);
    this.keys.set(service, {
      key: newKey,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    
    return newKey;
  }
}
```

---

### 🟡 P2: Add Content Security Policy Headers
**Current Issue:** No CSP headers configured.

**Impact:** Medium - Prevents XSS and data injection

**Solution:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.example.com",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 3. Database & Data Layer

### 🔴 P0: Add Database Indexes for Performance
**Current Issue:** Missing indexes on frequently queried columns.

**Impact:** Critical - Queries can be 10-100x faster

**Solution:**
```prisma
// prisma/schema.prisma - Add these indexes

model Order {
  // ... existing fields
  
  @@index([userId, createdAt]) // For user order history
  @@index([status, createdAt]) // For admin order filtering
  @@index([paymentStatus, createdAt]) // For payment tracking
  @@index([odooStatusSale, odooStatusPos]) // For sync monitoring
}

model Product {
  // ... existing fields
  
  @@index([categoryId, posAvailable]) // For category filtering
  @@index([isFeatured, isArchived]) // For featured products
  @@index([name]) // For search (consider full-text search)
}

model LoyaltyLedger {
  // ... existing fields
  
  @@index([userId, createdAt]) // For user points history
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_performance_indexes
```

**Files to Update:**
- [`prisma/schema.prisma`](prisma/schema.prisma:1-767)

---

### 🟠 P1: Implement Database Query Optimization
**Current Issue:** N+1 queries in order fetching.

**Impact:** High - Reduces database load significantly

**Solution:**
```typescript
// src/app/api/orders/route.ts
export async function GET(request: NextRequest) {
  // BEFORE (N+1 problem)
  const orders = await prisma.order.findMany({ where: { userId } });
  // Each order then fetches items separately
  
  // AFTER (optimized with includes)
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      address: true,
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Pagination
  });
}
```

**Files to Update:**
- [`src/app/api/orders/route.ts`](src/app/api/orders/route.ts:95)
- [`src/app/api/orders/[id]/route.ts`](src/app/api/orders/[id]/route.ts:108)

---

### 🟠 P1: Add Database Connection Health Checks
**Current Issue:** No monitoring of database connection health.

**Impact:** Medium - Prevents cascading failures

**Solution:**
```typescript
// src/app/api/health/route.ts - Enhance existing
export async function GET(_req: NextRequest) {
  const checks = {
    database: false,
    redis: false,
    odoo: false,
  };
  
  try {
    // Database check with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB timeout')), 5000)
      ),
    ]);
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  // Similar checks for Redis and Odoo...
  
  const isHealthy = Object.values(checks).every(Boolean);
  
  return NextResponse.json(
    { status: isHealthy ? 'healthy' : 'degraded', checks },
    { status: isHealthy ? 200 : 503 }
  );
}
```

**Files to Update:**
- [`src/app/api/health/route.ts`](src/app/api/health/route.ts:10)

---

### 🟡 P2: Implement Soft Delete Pattern
**Current Issue:** Hard deletes lose audit trail.

**Impact:** Medium - Improves data recovery and compliance

**Solution:**
```prisma
// prisma/schema.prisma
model Order {
  // ... existing fields
  deletedAt DateTime?
  
  @@index([deletedAt]) // For filtering active records
}

// In queries, always filter out soft-deleted records
const orders = await prisma.order.findMany({
  where: {
    userId,
    deletedAt: null, // Only active records
  },
});
```

---

### 🟡 P2: Add Database Backup Strategy
**Current Issue:** No documented backup/restore process.

**Impact:** Medium - Critical for disaster recovery

**Solution:**
```bash
# scripts/backup-database.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Backup Postgres
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_$DATE.sql"

# Backup Redis (if persistent)
redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Upload to S3 or similar
aws s3 cp "$BACKUP_DIR/db_$DATE.sql" s3://elite-backups/

echo "Backup completed: $DATE"
```

**Add to package.json:**
```json
{
  "scripts": {
    "backup": "bash scripts/backup-database.sh",
    "restore": "bash scripts/restore-database.sh"
  }
}
```

---

## 4. API Design & Backend

### 🟠 P1: Implement API Versioning
**Current Issue:** No API versioning strategy.

**Impact:** High - Enables backward compatibility

**Solution:**
```typescript
// src/app/api/v2/products/route.ts
export async function GET(request: NextRequest) {
  // New API version with breaking changes
  return NextResponse.json({
    version: '2.0',
    data: products,
    meta: { /* pagination, etc */ },
  });
}

// Maintain v1 for backward compatibility
// src/app/api/v1/products/route.ts (existing)
```

**Files to Create:**
- `src/app/api/v2/` directory structure
- Update documentation with versioning policy

---

### 🟠 P1: Add Request/Response Logging Middleware
**Current Issue:** Limited request logging for debugging.

**Impact:** High - Improves debugging and monitoring

**Solution:**
```typescript
// src/middleware/logging.ts
export function loggingMiddleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Log request
  console.log({
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
  
  // Add request ID to headers for tracing
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  
  // Log response (in production, use proper logging service)
  const duration = Date.now() - startTime;
  console.log({
    requestId,
    status: response.status,
    duration: `${duration}ms`,
  });
  
  return response;
}
```

---

### 🟡 P2: Implement GraphQL API Layer
**Current Issue:** REST API requires multiple requests for related data.

**Impact:** Medium - Reduces over-fetching and under-fetching

**Solution:**
```typescript
// src/app/api/graphql/route.ts
import { createYoga } from 'graphql-yoga';
import { schema } from './schema';

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
});

export { yoga as GET, yoga as POST };

// src/app/api/graphql/schema.ts
export const schema = buildSchema(`
  type Query {
    products(categoryId: String): [Product!]!
    order(id: ID!): Order
    cart: Cart!
  }
  
  type Product {
    id: ID!
    name: String!
    price: Float!
    category: Category!
  }
  
  # ... more types
`);
```

**Dependencies:**
```bash
npm install graphql graphql-yoga
```

---

### 🟡 P2: Add API Response Compression
**Current Issue:** Large JSON responses not compressed.

**Impact:** Medium - Reduces bandwidth by 60-80%

**Solution:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { compress } from 'compression';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add compression for API responses
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Content-Encoding', 'gzip');
  }
  
  return response;
}
```

---

### 🟢 P3: Implement Webhook System
**Current Issue:** No webhook support for external integrations.

**Impact:** Low - Enables third-party integrations

**Solution:**
```typescript
// src/app/api/webhooks/register/route.ts
export async function POST(request: NextRequest) {
  const { url, events } = await request.json();
  
  // Store webhook subscription
  await prisma.webhook.create({
    data: {
      url,
      events, // ['order.created', 'order.updated']
      secret: generateWebhookSecret(),
    },
  });
}

// src/server/services/webhookService.ts
export async function triggerWebhooks(event: string, data: any) {
  const webhooks = await prisma.webhook.findMany({
    where: { events: { has: event } },
  });
  
  for (const webhook of webhooks) {
    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signPayload(data, webhook.secret),
      },
      body: JSON.stringify({ event, data }),
    });
  }
}
```

---

## 5. Frontend & User Experience

### 🟠 P1: Implement Progressive Web App (PWA)
**Current Issue:** No offline support or app-like experience.

**Impact:** High - Improves mobile UX and engagement

**Solution:**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // ... existing config
});

// public/manifest.json
{
  "name": "ELITE Coffee Shop",
  "short_name": "ELITE",
  "description": "Order your favorite coffee",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#8B0000",
  "theme_color": "#8B0000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Dependencies:**
```bash
npm install next-pwa
```

---

### 🟠 P1: Add Skeleton Loading States
**Current Issue:** Blank screens during data loading.

**Impact:** High - Improves perceived performance

**Solution:**
```typescript
// src/components/skeletons/ProductCardSkeleton.tsx - Enhance existing
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 rounded-lg mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// Usage in pages
export default function ProductsPage() {
  const { products, loading } = useProducts();
  
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return <ProductGrid products={products} />;
}
```

**Files to Enhance:**
- [`src/components/skeletons/ProductCardSkeleton.tsx`](src/components/skeletons/ProductCardSkeleton.tsx)
- Add skeletons for all major components

---

### 🟡 P2: Implement Optimistic UI Updates
**Current Issue:** Cart updates wait for server response.

**Impact:** Medium - Improves perceived responsiveness

**Solution:**
```typescript
// src/hooks/useCart.ts - Already partially implemented, enhance it
export function useCart() {
  const [optimisticCart, setOptimisticCart] = useOptimistic(
    cart,
    (state, action) => {
      // Immediately update UI
      switch (action.type) {
        case 'add':
          return { ...state, items: [...state.items, action.item] };
        case 'remove':
          return {
            ...state,
            items: state.items.filter(i => i.id !== action.itemId),
          };
        // ... other actions
      }
    }
  );
  
  const addToCart = async (item) => {
    // Update UI immediately
    setOptimisticCart({ type: 'add', item });
    
    try {
      // Then sync with server
      await apiClient.post('/api/cart', item);
    } catch (error) {
      // Revert on error
      setOptimisticCart({ type: 'remove', itemId: item.id });
      toast.error('Failed to add item');
    }
  };
}
```

**Files to Update:**
- [`src/hooks/useCart.ts`](src/hooks/useCart.ts:1-331) - Already has foundation, enhance error handling

---

### 🟡 P2: Add Internationalization (i18n) Improvements
**Current Issue:** Limited language support and missing translations.

**Impact:** Medium - Expands market reach

**Solution:**
```typescript
// messages/ar.json - Add missing translations
{
  "cart": {
    "empty": "عربة التسوق فارغة",
    "addToCart": "أضف إلى السلة",
    "checkout": "إتمام الطلب"
  },
  "errors": {
    "networkError": "خطأ في الاتصال. يرجى المحاولة مرة أخرى",
    "serverError": "خطأ في الخادم. يرجى المحاولة لاحقاً"
  }
}

// Add language detection
// src/middleware.ts
export function middleware(request: NextRequest) {
  const locale = request.headers.get('accept-language')?.split(',')[0] || 'en';
  // ... handle locale routing
}
```

**Files to Update:**
- [`messages/ar.json`](messages/ar.json)
- [`messages/en.json`](messages/en.json)
- Add more languages (fr, es, etc.)

---

### 🟡 P2: Implement Virtual Scrolling for Long Lists
**Current Issue:** Product lists render all items at once.

**Impact:** Medium - Improves performance for large catalogs

**Solution:**
```typescript
// src/components/VirtualProductList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualProductList({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated item height
    overscan: 5, // Render 5 extra items
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ProductCard product={products[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Dependencies:**
```bash
npm install @tanstack/react-virtual
```

---

### 🟢 P3: Add Dark Mode Support
**Current Issue:** Only light theme available.

**Impact:** Low - Improves user preference options

**Solution:**
```typescript
// tailwind.config.ts - Already has darkMode: ["class"]
// Just need to implement the toggle

// src/components/ThemeToggle.tsx
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? <Moon /> : <Sun />}
    </button>
  );
}
```

**Files to Update:**
- [`tailwind.config.ts`](tailwind.config.ts:1-103) - Already configured
- Add dark mode variants to components

---

## 6. Testing & Quality Assurance

### 🔴 P0: Implement E2E Testing Suite
**Current Issue:** No end-to-end tests for critical user flows.

**Impact:** Critical - Prevents production bugs

**Solution:**
```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should complete order successfully', async ({ page }) => {
    // 1. Navigate to menu
    await page.goto('/menu');
    
    // 2. Add item to cart
    await page.click('[data-testid="product-card-1"]');
    await page.click('[data-testid="add-to-cart"]');
    
    // 3. Go to checkout
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="checkout-button"]');
    
    // 4. Fill delivery info
    await page.fill('[name="address"]', '123 Test St');
    await page.fill('[name="phone"]', '+201234567890');
    
    // 5. Complete order
    await page.click('[data-testid="place-order"]');
    
    // 6. Verify success
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });
});
```

**Setup:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Add to package.json:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

### 🟠 P1: Add Unit Tests for Business Logic
**Current Issue:** Limited test coverage for critical functions.

**Impact:** High - Catches bugs early

**Solution:**
```typescript
// tests/unit/cart.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotals } from '@/app/api/cart/route';

describe('Cart Calculations', () => {
  it('should calculate subtotal correctly', () => {
    const items = [
      { id: '1', price: 50, quantity: 2 },
      { id: '2', price: 30, quantity: 1 },
    ];
    
    const totals = calculateTotals(items);
    
    expect(totals.subtotal).toBe(130);
    expect(totals.tax).toBe(18.2); // 14% tax
    expect(totals.total).toBe(148.2);
  });
  
  it('should handle empty cart', () => {
    const totals = calculateTotals([]);
    expect(totals.total).toBe(0);
  });
});
```

**Files to Test:**
- Cart calculations
- Price validation
- Discount logic
- Points calculation
- Address validation

---

### 🟠 P1: Implement Integration Tests for APIs
**Current Issue:** No automated API testing.

**Impact:** High - Ensures API reliability

**Solution:**
```typescript
// tests/integration/api/products.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Products API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Setup: Get auth token
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    authToken = response.headers.get('authorization')!;
  });
  
  it('GET /api/products should return products', async () => {
    const response = await fetch('/api/products', {
      headers: { Authorization: authToken },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
  
  it('GET /api/products/:id should return single product', async () => {
    const response = await fetch('/api/products/test-product-id');
    expect(response.status).toBe(200);
  });
});
```

---

### 🟡 P2: Add Performance Testing
**Current Issue:** No load testing for production readiness.

**Impact:** Medium - Identifies bottlenecks before production

**Solution:**
```typescript
// tests/performance/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const response = http.get('https://your-domain.com/api/products');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Setup:**
```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Run test
k6 run tests/performance/load-test.ts
```

---

### 🟢 P3: Implement Visual Regression Testing
**Current Issue:** No automated UI testing for visual changes.

**Impact:** Low - Catches unintended UI changes

**Solution:**
```typescript
// tests/visual/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('homepage should match snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

---

## 7. Monitoring & Observability

### 🔴 P0: Implement Error Tracking with Sentry
**Current Issue:** Sentry configured but not fully utilized.

**Impact:** Critical - Catches production errors

**Solution:**
```typescript
// sentry.server.config.ts - Enhance existing
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  
  // Add custom error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception?.values?.[0]?.value?.includes('Network error')) {
      return null; // Don't send to Sentry
    }
    
    // Add user context
    if (event.user) {
      event.user.ip_address = '{{auto}}';
    }
    
    return event;
  },
  
  // Add performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'your-domain.com'],
    }),
  ],
});
```

**Files to Update:**
- [`sentry.server.config.ts`](sentry.server.config.ts)
- Add Sentry to all API error handlers

---

### 🟠 P1: Add Application Performance Monitoring (APM)
**Current Issue:** No visibility into performance bottlenecks.

**Impact:** High - Identifies slow queries and endpoints

**Solution:**
```typescript
// src/lib/monitoring/apm.ts
import { trace, context } from '@opentelemetry/api';

export function traceFunction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer('elite-coffee');
  const span = tracer.startSpan(name);
  
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: String(error) }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  });
}

// Usage
export async function fetchProducts() {
  return traceFunction('fetchProducts', async () => {
    return await prisma.product.findMany();
  });
}
```

**Dependencies:**
```bash
npm install @opentelemetry/api @opentelemetry/sdk-node
```

---

### 🟠 P1: Implement Structured Logging
**Current Issue:** Console.log statements everywhere.

**Impact:** High - Improves debugging and monitoring

**Solution:**
```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Usage
logger.info({ userId, orderId }, 'Order created successfully');
logger.error({ error, userId }, 'Failed to process payment');

// Replace all console.log with logger
```

**Dependencies:**
```bash
npm install pino pino-pretty
```

---

### 🟡 P2: Add Custom Metrics Dashboard
**Current Issue:** No centralized metrics visualization.

**Impact:** Medium - Improves operational visibility

**Solution:**
```typescript
// src/app/api/metrics/route.ts
export async function GET() {
  const metrics = {
    orders: {
      total: await prisma.order.count(),
      pending: await prisma.order.count({ where: { status: 'PENDING' } }),
      completed: await prisma.order.count({ where: { status: 'DELIVERED' } }),
    },
    revenue: {
      today: await calculateRevenue('today'),
      week: await calculateRevenue('week'),
      month: await calculateRevenue('month'),
    },
    users: {
      total: await prisma.user.count(),
      active: await prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    },
    cache: {
      hitRate: await getCacheHitRate(),
      size: await getCacheSize(),
    },
  };
  
  return NextResponse.json(metrics);
}
```

---

### 🟢 P3: Implement Uptime Monitoring
**Current Issue:** No external uptime monitoring.

**Impact:** Low - Alerts on downtime

**Solution:**
```typescript
// Use external service like UptimeRobot, Pingdom, or StatusCake
// Or implement custom:

// src/app/api/ping/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
  });
}

// Setup cron job to ping this endpoint every 5 minutes
// Alert if no response or status !== 'ok'
```

---

## 8. Code Quality & Maintainability

### 🟠 P1: Implement Consistent Error Handling
**Current Issue:** Inconsistent error handling across API routes.

**Impact:** High - Improves debugging and user experience

**Solution:**
```typescript
// src/lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }
  
  // Log unexpected errors
  logger.error({ error }, 'Unexpected error');
  
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  );
}

// Usage in API routes
export async function POST(request: NextRequest) {
  try {
    // ... handler logic
  } catch (error) {
    return handleError(error);
  }
}
```

**Files to Update:**
- All API route handlers
- [`src/server/utils/errors.ts`](src/server/utils/errors.ts)

---

### 🟠 P1: Add TypeScript Strict Mode
**Current Issue:** TypeScript not in strict mode.

**Impact:** High - Catches more bugs at compile time

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    // ... existing options
  }
}
```

**Files to Update:**
- [`tsconfig.json`](tsconfig.json:1-46)
- Fix type errors that surface

---

### 🟡 P2: Implement Code Documentation Standards
**Current Issue:** Inconsistent JSDoc comments.

**Impact:** Medium - Improves maintainability

**Solution:**
```typescript
/**
 * Adds an item to the user's shopping cart
 * 
 * @param userId - The unique identifier of the user
 * @param productId - The unique identifier of the product
 * @param quantity - The number of items to add (must be positive)
 * @returns Promise resolving to the updated cart
 * @throws {BadRequestError} If quantity is invalid
 * @throws {NotFoundError} If product doesn't exist
 * 
 * @example
 * ```typescript
 * const cart = await addToCart('user-123', 'product-456', 2);
 * console.log(cart.items.length); // 1
 * ```
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> {
  // Implementation
}
```

---

### 🟡 P2: Add Pre-commit Hooks
**Current Issue:** No automated checks before commits.

**Impact:** Medium - Prevents bad code from being committed

**Solution:**
```bash
# Install Husky
npm install -D husky lint-staged

# Setup
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

### 🟡 P2: Implement Dependency Update Strategy
**Current Issue:** Dependencies may become outdated.

**Impact:** Medium - Security and performance improvements

**Solution:**
```bash
# Install Renovate or Dependabot
# .github/renovate.json
{
  "extends": ["config:base"],
  "schedule": ["before 3am on Monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    }
  ]
}
```

---

### 🟢 P3: Add Code Coverage Reporting
**Current Issue:** No visibility into test coverage.

**Impact:** Low - Identifies untested code

**Solution:**
```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
      ],
