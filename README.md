# ELITE Coffee Shop - Full Stack E-Commerce Platform

A modern, production-ready coffee shop web application with Odoo ERP integration.

> **📚 Documentation Index:** [/docs/README.md](./docs/README.md)  
> **🤖 Agent Roles:** [Agent Roles](./docs/AGENT_ROLES_AND_STANDARDS.md)  
> **🚀 Getting Started:** [Getting Started Guide](./docs/GETTING_STARTED.md)  
> **📖 System Overview:** [System Overview](./docs/SYSTEM_OVERVIEW.md)  
> **🏗️ Architecture:** [Architecture V1](./docs/ARCHITECTURE_V1.md)  
> **🔐 Authentication:** [Auth System](./docs/AUTH_SYSTEM.md)

---

## ✨ Features

### Core Features
- ✅ **Passwordless Authentication** - Magic link email sign-in via NextAuth.js
- ✅ **User Management** - Profile, orders, loyalty points tracking
- ✅ **Role-Based Access** - User and admin roles with middleware protection
- ✅ **Product Catalog** - Redis-cached products from Odoo
- ✅ **Cart Management** - Session-based cart with price validation
- ✅ **Order Processing** - DB-first orders with async Odoo sync
- ✅ **Admin Panel** - User management, product sync, system health
- ✅ **Odoo Integration** - Optional ERP/POS connectivity (Sales & Kitchen Display)

### Architecture Highlights
- **Authentication**: NextAuth.js with magic link (passwordless)
- **Database**: Postgres with Prisma ORM
- **Caching**: Redis for products, categories, rate limiting
- **Queue**: BullMQ for async Odoo synchronization
- **Security**: Rate limiting, JWT sessions, security headers
- **Logging**: Comprehensive audit trail for auth events
- **API**: RESTful with 26+ well-structured endpoints

---

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript 5.8+
- **Styling:** Tailwind CSS 3.4+
- **Animations:** Framer Motion, GSAP
- **Auth:** NextAuth.js (magic link email)

### Backend
- **Runtime:** Node.js 18+
- **API:** Next.js Route Handlers (RESTful)
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (Upstash/self-hosted)
- **Queue:** BullMQ for background jobs
- **Integration:** Odoo JSON-RPC client (optional)

### Security
- **Authentication:** NextAuth.js (JWT sessions)
- **Rate Limiting:** Redis-backed (5 requests/hour)
- **Headers:** CSP, XSS, Clickjacking protection
- **Validation:** Zod schemas
- **Logging:** Comprehensive auth event tracking

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Redis server
- SMTP server (Gmail, SendGrid, SES)

### 1. Install Dependencies
```bash
   npm install
   ```

### 2. Set Environment Variables
Create `.env` file:
```bash
# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/elite

# Redis
REDIS_URL=redis://localhost:6379

# SMTP (for magic links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com

# Odoo (optional)
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key
```

See [ENV_EXAMPLE.md](./docs/ENV_EXAMPLE.md) for complete list.

### 3. Run Database Migration
```bash
npm run prisma:migrate
```

### 4. Start Services
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Development server
npm run dev

# Terminal 3: BullMQ worker (optional, for Odoo sync)
npm run worker:odoo
```

### 5. Create Admin User
```bash
npx prisma studio
# Navigate to User table
# Change role from 'user' to 'admin'
```

### 6. Test Authentication
Visit [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)

---

## 📚 API Documentation

### Authentication Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/signin` | GET/POST | Public | Sign-in page |
| `/api/auth/callback/email` | GET | Public | Magic link callback |
| `/api/auth/signout` | POST | Public | Sign out |
| `/api/auth/session` | GET | Public | Get session |
| `/api/auth/profile` | GET | Required | Get user profile |
| `/api/auth/profile` | PATCH | Required | Update profile |
| `/api/auth/profile` | DELETE | Required | Delete account |

### Product Catalog

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/products` | GET | Optional | List products (cached) |
| `/api/products/:id` | GET | Optional | Get single product |
| `/api/categories` | GET | Optional | List categories |
| `/api/sync/products` | POST | Admin | Trigger product sync |
| `/api/sync/status` | GET | Optional | Sync status |

### Cart & Orders

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cart` | GET | Required | Get cart |
| `/api/cart` | POST | Required | Add to cart |
| `/api/cart` | DELETE | Required | Clear cart |
| `/api/cart/:itemId` | DELETE | Required | Remove item |
| `/api/cart/:itemId` | PATCH | Required | Update quantity |
| `/api/orders` | GET | Required | List orders |
| `/api/orders` | POST | Required | Create order |
| `/api/orders/:id` | GET | Required | Get order details |
| `/api/orders/:id/status` | GET | Required | Order sync status |

### Admin Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/users/:id` | GET | Admin | Get user details |
| `/api/admin/users/:id` | PATCH | Admin | Update user |
| `/api/admin/users/:id` | DELETE | Admin | Delete user |

### System

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | Public | Health check |
| `/api/pos/availability` | GET | Optional | POS availability |

---

## 🗄️ Database Schema

### Core Models
- **User** - User accounts with email, role, status
- **Account** - OAuth provider accounts (NextAuth)
- **Session** - Active sessions (NextAuth)
- **VerificationToken** - Magic link tokens (NextAuth)
- **LoyaltyAccount** - User loyalty points and level
- **LoyaltyLedger** - Points transaction history
- **Order** - Orders with Odoo sync status
- **OrderItem** - Order line items
- **ProductsSnapshot** - Cached product data
- **SyncRun** - Product sync history

See [DB_SCHEMA_AND_CACHE_V1.md](./docs/DB_SCHEMA_AND_CACHE_V1.md) for details.

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run dev:turbo        # Start dev server with Turbopack

# Production
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations

# Worker
npm run worker:odoo      # Start BullMQ worker

# Code Quality
npm run lint             # TypeScript + ESLint
npm run format           # Format with Biome
```

---

## 🚀 Production Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import project from GitHub
   - Add environment variables
   - Deploy

3. **Set Up Services**
   - **Database**: Vercel Postgres or external Postgres
   - **Redis**: Upstash Redis (recommended for Vercel)
   - **Email**: SendGrid, AWS SES, or Gmail

4. **Configure Cron Job**
   The `vercel.json` file includes cron configuration:
   ```json
   {
     "crons": [
       {
         "path": "/api/sync/products",
         "schedule": "*/10 * * * *"
       }
     ]
   }
   ```

5. **Deploy Worker** (Optional)
   For BullMQ worker, deploy separately:
   ```bash
   # On a server or container
   npm run worker:odoo
   ```

### Environment Variables (Production)

```bash
# NextAuth
NEXTAUTH_SECRET=<production-secret>
NEXTAUTH_URL=https://your-domain.com

# Database
DATABASE_URL=<postgres-connection-string>

# Redis
REDIS_URL=<redis-connection-string>

# SMTP
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@your-domain.com

# Odoo (optional)
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key

# Node
NODE_ENV=production
```

### Post-Deployment

1. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

2. **Create admin user**
   ```bash
   npx prisma studio
   # Change role to 'admin'
   ```

3. **Trigger initial sync**
   ```bash
   curl -X POST https://your-domain.com/api/sync/products \
     -H "Authorization: Bearer <admin-token>"
   ```

4. **Test authentication**
   - Visit `/auth/signin`
   - Request magic link
   - Verify email delivery

---

## 🔐 Security Features

### Authentication
- ✅ Passwordless magic links (no password vulnerabilities)
- ✅ JWT sessions (secure, HttpOnly cookies)
- ✅ Single-use tokens (24-hour expiration)
- ✅ Rate limiting (5 magic links/hour per email)

### Application Security
- ✅ Security headers (CSP, XSS, Clickjacking)
- ✅ CSRF protection (built-in NextAuth)
- ✅ Input validation (Zod schemas)
- ✅ Role-based access control
- ✅ Middleware route protection

### Data Security
- ✅ Email masking in logs
- ✅ Soft deletes (account recovery)
- ✅ Comprehensive audit trail
- ✅ Price validation (prevents manipulation)

---

## 📖 Documentation

### Quick Start
- [AUTH_QUICKSTART.md](./docs/AUTH_QUICKSTART.md) - 5-minute setup
- [QUICKSTART.md](./docs/QUICKSTART.md) - General quick start

### Complete Guides
- [AUTH_SYSTEM_V1.md](./docs/AUTH_SYSTEM_V1.md) - Authentication system
- [ARCHITECTURE_V1.md](./docs/ARCHITECTURE_V1.md) - System architecture
- [API_CONTRACT_V1.md](./docs/API_CONTRACT_V1.md) - API specifications
- [DB_SCHEMA_AND_CACHE_V1.md](./docs/DB_SCHEMA_AND_CACHE_V1.md) - Database schema
- [SYNC_AND_ORDER_FLOW_V1.md](./docs/SYNC_AND_ORDER_FLOW_V1.md) - Sync & orders
- [ODOO_INTEGRATION.md](./docs/ODOO_INTEGRATION.md) - Odoo integration

### Implementation Details
- [AUTH_IMPLEMENTATION_SUMMARY.md](./docs/AUTH_IMPLEMENTATION_SUMMARY.md)
- [FRONTEND_INTEGRATION_COMPLETE.md](./docs/FRONTEND_INTEGRATION_COMPLETE.md)
- [IMPLEMENTATION_COMPLETE.md](./docs/IMPLEMENTATION_COMPLETE.md)

---

## 🎯 Troubleshooting

### Magic Links Not Arriving
```bash
# Test SMTP connection
node -e "require('nodemailer').createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your-email', pass: 'app-password' }
}).verify().then(console.log).catch(console.error)"
```

### Database Connection Issues
```bash
# Test connection
npx prisma db push
```

### Redis Connection Issues
```bash
# Test Redis
redis-cli PING
```

### Rate Limit Too Strict
```bash
# Clear rate limit for specific email
redis-cli DEL "ratelimit:auth:magiclink:user@example.com"
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

---

## 📄 License

This project is private and proprietary.

---

## 📚 Documentation

### Documentation Structure

All documentation is organized in `/docs/`:

**Core Guides:**
- [System Overview](./docs/SYSTEM_OVERVIEW.md) - Architecture and features overview
- [Getting Started](./docs/GETTING_STARTED.md) - Setup and development guide
- [Authentication System](./docs/AUTH_SYSTEM.md) - Complete auth documentation
- [Odoo Integration](./docs/ODOO_INTEGRATION.md) - ERP sync guide

**Reference:**
- [API Contract](./docs/API_CONTRACT_V1.md) - API endpoints reference
- [Database Schema](./docs/DB_SCHEMA_AND_CACHE_V1.md) - Data models
- [Architecture](./docs/ARCHITECTURE_V1.md) - System design
- [Environment Setup](./docs/ENV_EXAMPLE.md) - Environment variables

**Operations:**
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and fixes

**See [Documentation Index](./docs/README.md) for complete list**

### AI Workspace

The `/.ai-workspace/` folder is for AI assistants to create temporary iteration documents and analysis files. Finalized documentation should be moved to `/docs/`.

---

## 📞 Support

For issues and questions:
- Check [Troubleshooting](./docs/TROUBLESHOOTING.md)
- Review [Documentation Index](./docs/README.md)
- Search [GitHub Issues](https://github.com/Hamdysaad20/ELITE/issues)
- Create new issue for bugs

---

## 🎉 Status

**Backend:** 🟢 COMPLETE  
**Frontend:** 🟢 COMPLETE  
**Authentication:** 🟢 COMPLETE  
**Odoo Integration:** 🟢 COMPLETE  
**Loyalty System:** 🟢 COMPLETE  
**Security:** 🟢 COMPLETE  
**Documentation:** 🟢 ORGANIZED  
**Production:** 🟢 DEPLOYED

---

**Built with ❤️ by the Elite Coffee Shop team**
