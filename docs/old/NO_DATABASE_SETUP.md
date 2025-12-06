# 🚀 Elite Coffee Shop - No SQL Database Required

Your Elite Coffee Shop runs with a fully functional backend using **persistent JSON file storage**. No PostgreSQL, MySQL, or any SQL database needed!

## ✨ What You Get Out of the Box

### Backend Structure Created
```
src/
├── server/
│   ├── utils/
│   │   ├── apiHelpers.ts      # API response helpers
│   │   └── jsonDatabase.ts    # JSON file storage (persistent)
│   └── middleware/
│       └── auth.ts             # Authentication (ready for future)
├── app/api/                    # API Routes
│   ├── menu/                   # Menu endpoints ✅
│   ├── cart/                   # Cart management ✅
│   └── orders/                 # Order processing ✅
├── types/                      # TypeScript definitions
└── hooks/
    └── useCart.ts              # Cart management hook
```

### Working API Endpoints

All endpoints work with the JSON file database (data persists across restarts):

#### Menu API
- `GET /api/menu` - Get all menu categories
- `GET /api/menu/[category]` - Get specific category
- `GET /api/menu/items/[slug]` - Get menu item details

#### Cart API
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart` - Clear cart

#### Orders API
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details

## 🏃 Get Started (3 Steps)

### 1. Start Development Server
```powershell
npm run dev
```

### 2. Test the API
```powershell
# Get all menu items
curl http://localhost:3000/api/menu

# Get user's cart
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# Add item to cart
curl -X POST http://localhost:3000/api/cart -H "Content-Type: application/json" -H "x-user-id: demo-user" -d '{"menuItemId":"americano","quantity":2,"size":"Large"}'
```

### 3. Use in Your Frontend
```typescript
// Example: Fetch menu
const res = await fetch('/api/menu');
const { data } = await res.json();

// Example: Add to cart
await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'demo-user'
  },
  body: JSON.stringify({ menuItemId: 'americano', quantity: 2, size: 'Large' })
});
```

## 📦 Using the Custom Hook

```typescript
import { useCart } from '@/hooks/useCart';

function MyComponent() {
  const { 
    cart, 
    loading, 
    addToCart, 
    removeFromCart,
    itemCount,
    total 
  } = useCart();

  const handleAddToCart = async () => {
    await addToCart('americano', 2, { size: 'Large' });
  };

  return (
    <div>
      <p>Items in cart: {itemCount}</p>
      <p>Total: ${total.toFixed(2)}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

## 📚 Project Structure

```
elite-coffee-shop/
├── src/
│   ├── app/
│   │   ├── api/              # Backend API routes
│   │   │   ├── menu/         # Menu endpoints
│   │   │   ├── cart/         # Cart management
│   │   │   └── orders/       # Order processing
│   │   └── ...               # Frontend pages
│   ├── server/               # Backend logic
│   │   ├── utils/           
│   │   │   ├── apiHelpers.ts    # Response helpers
│   │   │   └── jsonDatabase.ts # Data storage (file-based)
│   │   └── middleware/       # Auth & security
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── lib/
│       └── menuData.ts       # Menu data source
└── ...
```

## ⚡ Key Features

✅ RESTful API - Clean, type-safe endpoints  
✅ JSON File Storage - Cart & orders persist across restarts  
✅ Type Safety - Full TypeScript support  
✅ Custom Hooks - Easy integration with React  
✅ No SQL Database - Works immediately  
✅ Production-Ready structure  

## 🔄 Data Persistence

### JSON File Storage (Persistent!)
**Current Setup:**
- **File:** `data/database.json`
- **Persistence:** Data survives server restarts
- **Thread-Safe:** Atomic read/write operations
- **Reset:** `npm run db:reset` clears all data

**Structure:**
```json
{
  "carts": {
    "user-id": {
      "userId": "user-id",
      "items": [/* cart items */]
    }
  },
  "orders": [/* all orders */]
}
```

### When You Need SQL Database
The JSON file storage works great for development and small-scale deployments. When you need:
- Millions of records
- Complex queries and relationships
- Concurrent writes at scale
- Advanced features (full-text search, geospatial)

You can migrate to SQL (PostgreSQL, MySQL, etc.) by:
1. Installing your preferred ORM (Prisma, Drizzle, TypeORM)
2. Creating a schema matching current types
3. Replacing `cartDB`/`orderDB` calls with ORM queries
4. Migrating existing JSON data to SQL

The API routes and validation stay the same!

## 🎨 Frontend Integration

### Option 1: Direct API Calls
```typescript
const response = await fetch('/api/menu');
const { data } = await response.json();
```

### Option 2: Custom Hooks (Recommended)
```typescript
const { cart, addToCart } = useCart();
```

### Option 3: React Query (Future)
```typescript
const { data } = useQuery('menu', () => 
  fetch('/api/menu').then(r => r.json())
);
```

## 🧪 Testing

### Test Menu Endpoint
```powershell
npm run dev
# Visit: http://localhost:3000/api/menu
# Or use curl:
curl http://localhost:3000/api/menu
```

### Test Complete Cart Flow
```powershell
# 1. View empty cart
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# 2. Add item to cart
curl -X POST http://localhost:3000/api/cart `
  -H "Content-Type: application/json" `
  -H "x-user-id: demo-user" `
  -d '{"menuItemId":"americano","quantity":2,"size":"Large"}'

# 3. View updated cart
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# 4. Create order from cart
curl -X POST http://localhost:3000/api/orders `
  -H "Content-Type: application/json" `
  -H "x-user-id: demo-user" `
  -d '{"paymentMethod":"CASH","notes":"Test order"}'

# 5. View order history
curl http://localhost:3000/api/orders -H "x-user-id: demo-user"
```

## 🚀 When You're Ready for SQL Database

### Why Migrate?
- Scale beyond 10,000s of records
- Need ACID transactions
- Complex joins and queries
- Full-text search
- Concurrent high-traffic loads

### Migration Steps

1. **Choose Your Stack**
   - Prisma + PostgreSQL (recommended)
   - Drizzle + any SQL database
   - TypeORM + PostgreSQL/MySQL
   - Kysely (type-safe SQL)

2. **Install Dependencies**
   ```powershell
   npm install @prisma/client prisma
   ```

3. **Create Schema**
   ```prisma
   // prisma/schema.prisma
   model Cart {
     id     String @id @default(cuid())
     userId String @unique
     items  CartItem[]
   }
   
   model Order {
     id            String   @id @default(cuid())
     userId        String
     total         Float
     status        OrderStatus
     paymentMethod PaymentMethod
     createdAt     DateTime @default(now())
     items         OrderItem[]
   }
   ```

4. **Update Data Layer**
   ```typescript
   // Replace cartDB calls
   // Before:
   import { cartDB } from '@/server/utils/jsonDatabase';
   const cart = cartDB.get(userId);
   
   // After:
   import { prisma } from '@/server/db';
   const cart = await prisma.cart.findUnique({
     where: { userId },
     include: { items: true }
   });
   ```

5. **Migrate Data**
   - Export from `database.json`
   - Import into SQL database
   - Verify data integrity

6. **Update Environment**
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/elite"
   ```

The API routes require minimal changes - just update the data access calls!

## 📖 Available Scripts

```powershell
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Typecheck + ESLint
npm run format    # Format code
npm run db:reset  # Reset JSON DB
```

## 🎯 Next Steps

1. Server is running - test the API endpoints
2. Integrate API calls in your frontend components
3. Use the `useCart` hook for cart management
4. Build your UI components
5. Add authentication when ready
6. Switch to database when needed

## 💡 Tips

- User ID: Currently using `demo-user` header. Replace with real auth later.
- Data Resets: Data clears on server restart (in-memory storage).
- Type Safety: All API responses are fully typed.
- Testing: Use browser dev tools or Postman to test endpoints.

## 🆘 Need Help?

- Check `PROJECT_STRUCTURE.md` for architecture details
- See `ODOO_INTEGRATION.md` to enable Odoo endpoints
- API returns errors with helpful messages
- All endpoints include TypeScript types

---

Everything works out of the box - no database setup required! 🎉

Start building your features right away and switch to a database later if you need it.
