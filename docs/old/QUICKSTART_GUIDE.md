# 🚀 Elite Coffee Shop - Quick Start Guide

## ⚡ Fast Setup (5 Minutes)

Get Elite Coffee Shop running with zero database configuration. This guide works on Windows PowerShell.

### Prerequisites
- Node.js 18+ installed
- npm package manager
- Git (optional)

---

## 📦 Installation Steps

### 1) Install Dependencies
```powershell
npm install
```

### 2) (Optional) Configure Odoo Integration
If you want to enable Odoo ERP/POS integration, create a `.env.local` file in the project root:

```dotenv
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key
ODOO_TIMEOUT_MS=20000
ODOO_INSECURE_SSL=true  # Dev only - allows self-signed certs
```

**Note:** You can skip this step entirely if you don't use Odoo. The app works perfectly without it.

### 3) Start the Development Server
```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🧪 Test the API

### Menu Endpoints
```powershell
# Get all menu categories
curl http://localhost:3000/api/menu

# Get specific category
curl http://localhost:3000/api/menu/classic-drinks

# Get menu item details
curl http://localhost:3000/api/menu/items/americano
```

### Cart Endpoints
```powershell
# Get cart (uses x-user-id header; defaults to demo-user)
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# Add item to cart
curl -X POST http://localhost:3000/api/cart `
  -H "Content-Type: application/json" `
  -H "x-user-id: demo-user" `
  -d '{"menuItemId":"americano","quantity":2,"size":"Large","flavor":"Vanilla"}'

# Clear cart
curl -X DELETE http://localhost:3000/api/cart -H "x-user-id: demo-user"
```

### Order Endpoints
```powershell
# Create order from cart
curl -X POST http://localhost:3000/api/orders `
  -H "Content-Type: application/json" `
  -H "x-user-id: demo-user" `
  -d '{"paymentMethod":"CASH","notes":"Extra hot please"}'

# Get user orders
curl http://localhost:3000/api/orders -H "x-user-id: demo-user"
```

### Odoo Integration (Optional)
```powershell
# Test Odoo connection
curl http://localhost:3000/api/odoo/orders

# Create sale order in Odoo
curl -X POST http://localhost:3000/api/odoo/orders `
  -H "Content-Type: application/json" `
  -d '{
    "partner": {"name": "John Doe", "email": "john@example.com"},
    "items": [{"menuItemId": "LATTE-MED", "name": "Latte", "quantity": 2, "unitPrice": 30}],
    "autoConfirm": true,
    "orderNumber": "WEB-TEST-001"
  }'

# POS order for Kitchen Display
curl -X POST http://localhost:3000/api/odoo/pos/orders `
  -H "Content-Type: application/json" `
  -d '{
    "partner": {"name": "Table 7"},
    "items": [{"menuItemId": "LATTE-MED", "name": "Latte", "quantity": 2, "unitPrice": 30}],
    "notes": "No sugar",
    "posConfigName": "Main Register"
  }'
```

---

## 🔧 Useful Commands

```powershell
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Typecheck + ESLint
npm run format    # Format code with Biome
npm run db:reset  # Reset JSON database (data/database.json)
```

---

## 💻 Frontend Integration Examples

### Using the Cart Hook (Recommended)
```typescript
import { useCart } from '@/hooks/useCart';

function MyComponent() {
  const { cart, addToCart, removeFromCart, total, loading, error } = useCart();

  const handleAdd = async () => {
    await addToCart('americano', 2, {
      size: 'Large',
      flavor: 'Vanilla',
      toppings: ['Whipped Cream']
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Cart Total: ${total.toFixed(2)}</p>
      <button onClick={handleAdd}>Add to Cart</button>
    </div>
  );
}
```

### Direct API Calls
```typescript
// Get menu data
const response = await fetch('/api/menu');
const { success, data } = await response.json();

// Add to cart
const response = await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'demo-user'
  },
  body: JSON.stringify({
    menuItemId: 'latte',
    quantity: 1,
    size: 'Medium',
    flavor: 'Vanilla'
  })
});

const { success, data } = await response.json();
```

---

## 📊 Data Storage

- **Location:** `data/database.json`
- **Type:** JSON file (persistent across server restarts)
- **Structure:**
  ```json
  {
    "carts": {
      "user-id": {
        "userId": "user-id",
        "items": [ /* cart items */ ]
      }
    },
    "orders": [ /* all orders */ ]
  }
  ```
- **Reset:** Run `npm run db:reset` to clear all data

---

## 📝 Important Notes

- **No SQL Database Required:** Data is stored in `data/database.json` and persists between server restarts
- **User Identity:** Uses `x-user-id` header (defaults to `demo-user`)
- **Dev Server:** Uses Turbopack and binds to `0.0.0.0` by default
- **Type Safety:** All API responses are fully typed with TypeScript
- **Validation:** Request bodies are validated using Zod schemas

---

## 🔧 Troubleshooting

### Port 3000 already in use
```powershell
# Option 1: Kill the process using the port
npx kill-port 3000

# Option 2: Run on a different port
npm run dev -- -p 3001
```

### Module not found errors
```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules, .next
npm install
```

### Type errors
```powershell
# Run type checking
npm run lint
```

### Odoo connection errors
- Verify `.env.local` values are correct
- Prefer `ODOO_API_KEY` over `ODOO_PASSWORD`
- Check that Odoo is accessible from your network
- For development with self-signed certs, set `ODOO_INSECURE_SSL=true`

### Data issues
```powershell
# Reset the database
npm run db:reset

# Verify the database file exists
Test-Path data/database.json
```

---

## 🚀 Deployment

### Build for Production
```powershell
npm run build
npm run start
```

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables (if using Odoo)
4. Deploy!

### Deploy to Netlify
Configure `netlify.toml` (already included):
- Build command: `npm run build`
- Publish directory: `.next`

---

## 📞 Support & Documentation

- **Full Documentation:** [docs/README.md](./README.md)
- **API Reference:** [START_HERE.md](./START_HERE.md)
- **Project Structure:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **No Database Setup:** [NO_DATABASE_SETUP.md](./NO_DATABASE_SETUP.md)
- **Odoo Integration:** [ODOO_INTEGRATION.md](./ODOO_INTEGRATION.md)

---

## 🎉 You're All Set!

Your Elite Coffee Shop is now running and ready for development!

**Next Steps:**
1. ✅ Browse to http://localhost:3000
2. ✅ Explore the menu system
3. ✅ Test the cart functionality
4. ✅ Create test orders
5. ✅ Review the API documentation
6. 🔨 Start building features!

**Happy Coding! ☕**
