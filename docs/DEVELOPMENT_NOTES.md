# Development Notes & Common Issues

**Date:** December 5, 2024

---

## 🔧 Common Development Issues

### 1. Empty Redis Cache (503 Errors)

**Symptom:**
```
GET /api/categories 503
GET /api/products 503
Error: "Category cache is empty. Run /api/sync/products to populate."
```

**Cause:** Redis cache hasn't been populated with products from Odoo yet.

**Solutions:**

#### Option A: Trigger Product Sync (Requires Odoo)
```bash
# Make sure Odoo env vars are set first
curl -X POST http://localhost:3000/api/sync/products \
  -H "x-admin-token: your-admin-token"
```

#### Option B: Use Development Fallback (No Odoo Required)
The menu pages now automatically fall back to static `menuData` when cache is empty.
You'll see a yellow banner: "Development Mode: Showing local menu data."

**This is intentional** for development without Odoo.

---

### 2. SMTP Connection Failed

**Symptom:**
```
❌ SMTP connection failed: [Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Cause:** Gmail SMTP credentials are incorrect or app password not generated.

**Solution:**

#### For Gmail:
1. Go to https://myaccount.google.com/apppasswords
2. Create a new app password
3. Update `.env`:
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=<your-16-char-app-password>
EMAIL_FROM=your-email@gmail.com
```

#### Or Use Development Email (Ethereal)
```bash
# Install ethereal account generator
npm install --save-dev nodemailer

# Create test account
node -e "require('nodemailer').createTestAccount().then(account => console.log(account))"

# Use the generated credentials in .env
```

#### Or Skip Email for Now
Magic links will be printed to console in development mode.
Just look for the link in terminal output.

---

### 3. NextAuth Warnings

**Symptom:**
```
[next-auth][warn][NEXTAUTH_URL]
[next-auth][warn][DEBUG_ENABLED]
```

**Solution:** Add to `.env`:
```env
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

---

### 4. Database Connection Issues

**Symptom:**
```
Error: Can't reach database server
```

**Solution:**

#### Check DATABASE_URL
```bash
# Test connection
npx prisma db push
```

#### For Local Postgres:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/elite
```

#### For Neon/Vercel Postgres:
```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require
```

---

### 5. Redis Connection Issues

**Symptom:**
```
Error: ECONNREFUSED localhost:6379
```

**Solution:**

#### Start Redis Locally
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows (WSL)
redis-server
```

#### Or Use Upstash (Cloud Redis)
```env
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

#### Or Skip Redis for Now
The system will gracefully degrade:
- Menu pages use static fallback
- Rate limiting disabled (logs warning)
- Product cache disabled

---

### 6. Migration Pending

**Symptom:**
```
Property 'review' does not exist on Prisma Client
```

**Solution:**
```bash
# Run migration to add Review table
npm run prisma:migrate

# Or manually
npx prisma migrate dev --name add_reviews_and_more
```

---

## 🚀 Quick Start Without External Services

For local development without Odoo/Redis/SMTP:

### Minimal .env
```env
# Database (local Postgres)
DATABASE_URL=postgresql://postgres:password@localhost:5432/elite

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Skip these for now:
# REDIS_URL=
# EMAIL_SERVER_*=
# ODOO_*=
```

### What Works Without External Services:
- ✅ Menu browsing (static fallback)
- ✅ User authentication (console magic links)
- ✅ Cart management
- ✅ Order placement (DB only, no Odoo sync)
- ✅ User profiles
- ✅ Loyalty (basic tracking)

### What Requires External Services:
- ⚠️ Product sync (requires Odoo + Redis)
- ⚠️ Email magic links (requires SMTP)
- ⚠️ Rate limiting (requires Redis)
- ⚠️ Odoo order sync (requires Odoo)
- ⚠️ Error tracking (requires Sentry)

---

## 📋 Development Checklist

### First Time Setup
- [ ] Install dependencies: `npm install`
- [ ] Set up Postgres database
- [ ] Create `.env` file (see ENV_EXAMPLE.md)
- [ ] Run migrations: `npm run prisma:migrate`
- [ ] Start dev server: `npm run dev`

### With Full Stack
- [ ] Start Redis: `redis-server`
- [ ] Configure SMTP (Gmail app password)
- [ ] Configure Odoo credentials
- [ ] Trigger product sync: `POST /api/sync/products`
- [ ] Start worker: `npm run worker:odoo`

### Testing Features

#### Auth
```bash
# Visit http://localhost:3000/auth/signin
# Enter email
# Check terminal for magic link (if SMTP not configured)
# Click link to sign in
```

#### Catalog
```bash
# Without Odoo/Redis: Uses static fallback automatically
# With Odoo/Redis: Trigger sync first
curl -X POST http://localhost:3000/api/sync/products \
  -H "x-admin-token: change-me"
```

#### Orders
```bash
# Add items to cart
# Place order
# Check /orders to see order history
# With Odoo: Worker will sync in background
```

---

## 🐛 Troubleshooting

### Menu Shows "Development Mode" Banner
**This is normal!** It means:
- Redis cache is empty OR
- Redis is not running OR
- Product sync hasn't been triggered

**Action:** Either trigger sync or ignore (static data works for development)

### Magic Links Not Arriving
**Expected in development** if SMTP not configured.
**Workaround:** Check terminal output for the magic link URL.

### Products Not Syncing
**Check:**
1. Odoo env vars are set
2. Odoo is accessible
3. Redis is running
4. Admin token is correct

### Worker Not Processing Jobs
**Check:**
1. Redis is running
2. `npm run worker:odoo` is running
3. Check worker logs for errors

---

## ✅ Recommended Development Flow

### Minimal Setup (No External Services)
```bash
1. npm install
2. Set DATABASE_URL in .env
3. npm run prisma:migrate
4. npm run dev
5. Visit http://localhost:3000
```

**Result:** Full app works with static menu data and console magic links.

### Full Setup (All Services)
```bash
1. Start Postgres
2. Start Redis: redis-server
3. Set all env vars (.env)
4. npm run prisma:migrate
5. npm run dev (terminal 1)
6. npm run worker:odoo (terminal 2)
7. Trigger sync: POST /api/sync/products
```

**Result:** Production-like environment with live Odoo sync.

---

## 📚 Reference

- **Environment vars:** `docs/ENV_EXAMPLE.md`
- **Deployment:** `docs/DEPLOYMENT_GUIDE.md`
- **Quick start:** `docs/AUTH_QUICKSTART.md`

---

**Status:** Development-friendly with graceful fallbacks ✅

