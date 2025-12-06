# Elite Coffee Shop - Project Architecture

This document describes the complete codebase layout and backend architecture of Elite Coffee Shop. The project uses Next.js 15 with App Router, TypeScript, Tailwind CSS, and a JSON file-based database with optional Odoo ERP/POS integration.

## 🏗️ Repository Tree (key parts)

```
ELITE/
├── data/
│   └── database.json            # Persistent JSON database (carts, orders)
├── public/
│   └── images/                  # Static assets
├── src/
│   ├── app/                     # Next.js App Router (Next 15)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Home
│   │   ├── api/                 # Backend API routes
│   │   │   ├── cart/
│   │   │   │   └── route.ts     # GET/POST/DELETE /api/cart
│   │   │   ├── menu/
│   │   │   │   ├── route.ts     # GET /api/menu
│   │   │   │   ├── [category]/route.ts
│   │   │   │   └── items/[slug]/route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts     # GET/POST /api/orders
│   │   │   │   └── [id]/route.ts
│   │   │   └── odoo/            # Odoo JSON-RPC integrations
│   │   │       ├── orders/route.ts       # GET diagnostics, POST sale order
│   │   │       ├── order-test/route.ts   # POST quick single-item order
│   │   │       ├── products/route.ts     # GET product list
│   │   │       └── pos/
│   │   │           ├── route.ts          # GET POS diagnostics
│   │   │           └── orders/route.ts   # POST pos.order (Kitchen Display)
│   │   ├── menu/                # Menu pages (categories/subcategories)
│   │   ├── rewards/
│   │   └── shop/
│   ├── components/              # UI components
│   ├── hooks/
│   │   └── useCart.ts           # Client cart helper
│   ├── lib/
│   │   └── menuData.ts          # Menu data source
│   ├── server/
│   │   ├── middleware/
│   │   │   └── auth.ts          # Placeholder auth middleware
│   │   ├── utils/
│   │   │   ├── apiHelpers.ts    # jsonResponse/error helpers
│   │   │   ├── errors.ts        # HTTP error classes
│   │   │   ├── jsonDatabase.ts  # JSON DB read/write helpers
│   │   │   └── odooClient.ts    # Odoo JSON-RPC client
│   │   └── validators/
│   │       ├── cartSchemas.ts
│   │       └── orderSchemas.ts
│   └── types/
│       └── index.ts             # Shared TypeScript types
├── package.json                 # Scripts and dependencies
├── next.config.js
├── tailwind.config.ts
└── docs/                        # Documentation (source of truth)
```

**Key Points:**
- **No SQL Database Required:** All data persists in `data/database.json`
- **JSON Database Helpers:** Located in `src/server/utils/jsonDatabase.ts`
- **API Validation:** Zod schemas in `src/server/validators/`
- **Type Safety:** Full TypeScript coverage with strict mode
- **Optional Odoo:** JSON-RPC client for ERP integration

## 🔧 Runtime and Scripts

From `package.json` (PowerShell):

```powershell
npm run dev       # Start dev server with Turbopack (binds to 0.0.0.0)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # TypeScript checking + ESLint
npm run format    # Format code with Biome
npm run db:reset  # Reset JSON database to empty state
```

## 📦 Key Dependencies

**Core:**
- next 15.0+ (App Router, React Server Components)
- react 18.3+, react-dom 18.3+
- typescript 5.6+

**Styling & UI:**
- tailwindcss 3.4+
- framer-motion (animations)
- gsap (advanced animations)
- class-variance-authority (component variants)

**Validation & Data:**
- zod (schema validation)
- axios (HTTP client for Odoo)
- tough-cookie (cookie management)

**Dev Tools:**
- @biomejs/biome (linting & formatting)
- eslint (code quality)
- turbopack (fast bundling)

## 💾 Data Storage

**File:** `data/database.json`

**Access:** Via `src/server/utils/jsonDatabase.ts` providing:
- `cartDB.get(userId)` - Get user's cart
- `cartDB.set(userId, cart)` - Update user's cart
- `cartDB.delete(userId)` - Clear user's cart
- `orderDB.getAll(userId?)` - Get all orders (optionally filtered by user)
- `orderDB.getById(orderId)` - Get specific order
- `orderDB.create(order)` - Create new order

**Structure:**
```json
{
  "carts": {
    "user-id": {
      "userId": "user-id",
      "items": [
        {
          "id": "uuid",
          "menuItemId": "americano",
          "quantity": 2,
          "size": "Large",
          "flavor": "Vanilla",
          "toppings": ["Whipped Cream"],
          "price": 12.99,
          "menuItem": { /* full menu item data */ }
        }
      ]
    }
  },
  "orders": [
    {
      "id": "uuid",
      "userId": "user-id",
      "items": [...],
      "total": 45.99,
      "status": "PENDING",
      "paymentMethod": "CASH",
      "paymentStatus": "PENDING",
      "createdAt": "2024-12-01T...",
      "notes": "Extra hot"
    }
  ]
}
```

**Features:**
- Thread-safe read/write operations
- Atomic file updates (prevents data corruption)
- Automatic backup on write errors
- Persists across server restarts
- Reset with `npm run db:reset`

## 🚀 API Endpoints

### Menu API
- `GET /api/menu` - Get all categories with items
- `GET /api/menu/[category]` - Get specific category (e.g., `/api/menu/classic-drinks`)
- `GET /api/menu/items/[slug]` - Get item details (e.g., `/api/menu/items/americano`)

### Cart API (requires `x-user-id` header)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
  ```json
  { "menuItemId": "americano", "quantity": 2, "size": "Large", "flavor": "Vanilla", "toppings": [] }
  ```
- `DELETE /api/cart` - Clear entire cart
- `DELETE /api/cart/[itemId]` - Remove specific item
- `PATCH /api/cart/[itemId]` - Update item quantity
  ```json
  { "quantity": 3 }
  ```

### Orders API (requires `x-user-id` header)
- `GET /api/orders` - Get user's order history
- `POST /api/orders` - Create order from cart
  ```json
  { "paymentMethod": "CASH", "addressId": "optional", "notes": "Extra hot" }
  ```
- `GET /api/orders/[id]` - Get specific order details

### Odoo Integration (optional)
**Sales Orders:**
- `GET /api/odoo/orders` - Diagnostics (configured, ping, hasSale, productCount)
- `POST /api/odoo/orders` - Create sale.order (with optional auto-confirm)
- `POST /api/odoo/order-test` - Quick single-item test order

**Products:**
- `GET /api/odoo/products` - List products with sampling, expansions, and filtering
  - Query params: `model`, `limit`, `sample`, `random`, `fields`, `expand`, `imageSize`

**Point of Sale (Kitchen Display):**
- `GET /api/odoo/pos` - POS diagnostics (configs, open sessions)
- `POST /api/odoo/pos/orders` - Create pos.order for Kitchen Display

## 🔐 Configuration

### Environment Variables
Optional Odoo integration (set in `.env` or `.env.local`):

```bash
# Odoo Connection
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key          # Preferred over password
# ODOO_PASSWORD=optional_password   # Fallback if no API key

# Optional Settings
ODOO_TIMEOUT_MS=20000               # Request timeout (default: 20000)
ODOO_INSECURE_SSL=true              # Dev only - allows self-signed certs
```

**No `DATABASE_URL` required** - the app uses JSON file storage.

### User Identification
- API routes use `x-user-id` header for user context
- Defaults to `demo-user` if not provided
- Production: replace with JWT or session-based auth

## 🧗 Future Work & Migration Path

### Database Migration (When Needed)
**Current:** JSON file storage (`data/database.json`)

**Migration to SQL:**
1. Choose ORM: Prisma, Drizzle, TypeORM, or Kysely
2. Define schema matching current TypeScript types
3. Install dependencies and generate client
4. Replace `cartDB` and `orderDB` calls with ORM queries
5. Migrate existing data from JSON to SQL
6. Update API routes (minimal changes needed)

**Example Migration:**
```typescript
// Before (JSON)
import { cartDB } from '@/server/utils/jsonDatabase';
const cart = cartDB.get(userId);

// After (Prisma)
import { prisma } from '@/server/db';
const cart = await prisma.cart.findUnique({
  where: { userId },
  include: { items: { include: { menuItem: true } } }
});
```

### Authentication & Authorization
- Replace `x-user-id` header with JWT tokens
- Add user registration/login flows
- Implement role-based access control (admin, customer, staff)
- Session management

### Additional Features
- Payment processing (Stripe, PayPal)
- Email notifications (order confirmations, receipts)
- Admin dashboard
- Analytics and reporting
- Rate limiting and security middleware
- Caching layer (Redis)
- File uploads for user avatars
- Real-time order tracking (WebSockets)

### Production Considerations
- Database connection pooling
- Logging and monitoring (Winston, Pino)
- Error tracking (Sentry)
- Performance optimization
- Load balancing
- Backup strategies
- CI/CD pipeline

---

## \ud83d\udcdd Summary

Elite Coffee Shop is a production-ready Next.js application with:

\u2705 **Complete Backend:** RESTful API with 10+ endpoints  
\u2705 **JSON Database:** Persistent file-based storage  
\u2705 **Type Safety:** Full TypeScript with Zod validation  
\u2705 **Scalable Architecture:** Easy migration to SQL when needed  
\u2705 **Optional Integrations:** Odoo ERP/POS support  
\u2705 **Modern Stack:** Next.js 15, React 18, Tailwind CSS  
\u2705 **Developer Experience:** Fast builds with Turbopack, Biome formatting  

**Last Updated:** December 1, 2025  
**Maintainers:** Development Team
