# ⚡ Quick Start (3 Minutes)

Get Elite Coffee Shop running immediately with zero configuration.

## Prerequisites
- Node.js 18+ installed
- Git (optional)

---

## 🚀 Start in 3 Steps

### 1. Install
```powershell
npm install
```

### 2. Run
```powershell
npm run dev
```

### 3. Test
Open http://localhost:3000

---

## 🧪 Test the API

```powershell
# Menu
curl http://localhost:3000/api/menu

# Cart
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# Create Order
curl -X POST http://localhost:3000/api/orders `
  -H "Content-Type: application/json" `
  -H "x-user-id: demo-user" `
  -d '{"paymentMethod":"CASH","notes":"Test order"}'
```

---

## 📚 What's Next?

- **Full Guide:** See [QUICKSTART_GUIDE.md](./QUICKSTART_GUIDE.md)
- **API Docs:** See [START_HERE.md](./START_HERE.md)
- **Odoo Setup:** See [ODOO_INTEGRATION.md](./ODOO_INTEGRATION.md)

---

## 🔧 Essential Commands

```powershell
npm run dev       # Development server
npm run build     # Production build
npm run lint      # Type checking + ESLint
npm run format    # Format code with Biome
npm run db:reset  # Clear all data
```

---

## 💡 Key Info

- **No Database Setup:** Uses JSON file (`data/database.json`)
- **Data Persists:** Survives server restarts
- **User ID:** Header `x-user-id` (defaults to `demo-user`)
- **Reset Data:** Run `npm run db:reset` anytime

---

**Ready to build! ☕**
