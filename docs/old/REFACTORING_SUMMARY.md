# Elite Coffee Shop - Full Stack Application

A modern, full-stack coffee shop web application built with Next.js 15, TypeScript, and JSON file-based storage.

## 🏗️ Project Structure

```
elite-coffee-shop/
├── data/                   # JSON database
│   └── database.json      # Persistent storage
├── public/                 # Static assets
│   └── images/            # Images
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── rewards/       # Rewards page
│   │   └── shop/          # Shop page
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── server/            # Backend logic
│   │   └── utils/         # Server utilities (JSON database, API helpers)
│   └── types/             # TypeScript types
└── ...config files
| `ODOO_API_KEY` | Odoo API key (preferred) | No |
| `ODOO_PASSWORD` | Odoo password (fallback) | No |
| `ODOO_TIMEOUT_MS` | Optional request timeout (ms) | No |
| `ODOO_INSECURE_SSL` | Allow self-signed certs in dev (true/false) | No |
## 🚀 Features

### Current Features
- ✅ Menu browsing with categories and subcategories
- ✅ Order management system
- ✅ RESTful API endpoints
- ✅ JSON file-based persistent storage
- ✅ TypeScript for type safety

### Backend Architecture
- **API Routes**: RESTful API endpoints using Next.js Route Handlers
- **Data Storage**: JSON file-based database (no PostgreSQL needed!)

### Planned Features
- 🔄 User authentication (JWT)
- 🔄 Payment integration
- 🔄 Order tracking
- 🔄 Reviews and ratings
- 🔄 Rewards program
- 🔄 Admin dashboard

## 📦 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion, GSAP
- **UI Components**: Custom components with class-variance-authority

### Backend
- **Runtime**: Node.js
- **Database**: JSON File Storage (no setup required!)
- **API**: Next.js Route Handlers
- **Type Safety**: TypeScript

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd elite-coffee-shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 API Documentation

### Menu Endpoints

#### Get All Categories
```http
GET /api/menu
```

#### Get Category by Slug
```http
GET /api/menu/[category]
```

#### Get Menu Item by Slug
```http
GET /api/menu/items/[slug]
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Headers: x-user-id: <user-id>
```

#### Add to Cart
```http
POST /api/cart
Headers: x-user-id: <user-id>
Content-Type: application/json

{
  "menuItemId": "string",
  "quantity": number,
  "size": "string",
  "flavor": "string",
  "toppings": ["string"]
}
```

#### Clear Cart
```http
DELETE /api/cart
Headers: x-user-id: <user-id>
```

### Order Endpoints

#### Get User Orders
```http
GET /api/orders
Headers: x-user-id: <user-id>
```

#### Create Order
```http
POST /api/orders
Headers: x-user-id: <user-id>
Content-Type: application/json

{
  "paymentMethod": "CASH" | "CARD" | "WALLET" | "ONLINE",
  "addressId": "string",
  "notes": "string"
}
```

#### Get Order by ID
```http
GET /api/orders/[id]
Headers: x-user-id: <user-id>
```

## 🗄️ Database Schema

### Main Models
- **User**: Customer accounts and authentication
- **Category**: Menu categories
- **SubCategory**: Menu subcategories
- **MenuItem**: Individual menu items
- **Size/Flavor/Topping**: Customization options
- **Cart/CartItem**: Shopping cart
- **Order/OrderItem**: Order management
- **Review**: Product reviews
- **Reward**: Loyalty program
- **Address**: User addresses

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Biome

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

## 🏗️ Development Workflow

1. **Make changes** to your code
2. **Run linter**: `npm run lint`
3. **Format code**: `npm run format`
4. **Test locally**: `npm run dev`
5. **Build**: `npm run build`
6. **Commit** your changes

## 📝 Code Style

- TypeScript for type safety
- ESLint for code quality
- Biome for code formatting
- Follow the existing project structure

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Application URL | No |
| `NODE_ENV` | Environment (development/production) | No |
| `ODOO_HOST` | Odoo base URL (e.g., https://odoo.example.com:8069) | No |
| `ODOO_DB` | Odoo database name | No |
| `ODOO_USERNAME` | Odoo API user | No |
| `ODOO_PASSWORD` | Odoo API password | No |
| `ODOO_TIMEOUT_MS` | Optional request timeout (ms) | No |

**Note**: No database connection string needed! The app uses JSON file storage.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Troubleshooting

### Data Issues
- Check `data/database.json` file exists
- Reset database: `npm run db:reset`
- Verify file permissions

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🧩 Odoo POS/ERP Integration (Optional)

This project can push website orders into Odoo's Sales module using JSON‑RPC.

- Configure env vars in `.env` (see `.env.example`).
- Test connectivity:
   ```http
   POST /api/odoo/test
   ```
- Create a website order via `POST /api/orders` and it will best‑effort sync to Odoo.

See the full guide in `ODOO_INTEGRATION.md`.

## 📞 Support

For issues and questions, please contact the development team.
