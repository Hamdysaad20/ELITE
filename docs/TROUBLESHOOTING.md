# Troubleshooting Guide

Quick fixes for common development issues.

---

## 🔧 Common Errors in Terminal

### 1. ❌ SMTP connection failed

```
❌ SMTP connection failed: [Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**This is OK in development!** Magic links will print to console instead.

**To Fix (Optional):**
1. Go to https://myaccount.google.com/apppasswords
2. Generate app password
3. Update `.env`:
```env
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=<16-char-app-password>
```

**Or ignore it** - System works fine with console magic links for development.

---

### 2. Redis error [Error: read ECONNRESET]

```
Redis error [Error: read ECONNRESET] {
  errno: -54,
  code: 'ECONNRESET'
}
```

**Cause:** Redis is not running or connection was lost.

**Solutions:**

#### Start Redis:
```bash
# macOS
brew services start redis

# Or run in terminal
redis-server
```

#### Or Use Cloud Redis (Upstash):
```env
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

#### Or Ignore for Development:
Menu pages will automatically use static data fallback. ✅

---

### 3. NextAuth Warnings

```
[next-auth][warn][NEXTAUTH_URL]
[next-auth][warn][DEBUG_ENABLED]
```

**To Fix:** Add to `.env`:
```env
NEXTAUTH_URL=http://localhost:3000
```

**These are warnings, not errors** - system still works.

---

### 4. GET /api/categories 503

```
GET /api/categories 503 in 1505ms
GET /api/products 503 in 1199ms
```

**Cause:** Redis cache is empty (no products synced yet).

**Solutions:**

#### Menu pages work automatically!
They use static data fallback. You'll see a yellow banner: "Development Mode"

#### To use live Odoo data:
```bash
# 1. Set Odoo env vars
# 2. Trigger sync
curl -X POST http://localhost:3000/api/sync/products \
  -H "x-admin-token: change-me"
```

---

## ✅ Quick Development Setup

### Minimal .env (No External Services)
```env
# Just Postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/elite

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### What Works:
- ✅ Homepage
- ✅ Menu (static fallback)
- ✅ Cart
- ✅ Orders (DB only, no Odoo sync)
- ✅ Auth (console magic links)
- ✅ Rewards page (requires sign-in)

### What's Optional:
- Redis (uses static fallback)
- SMTP (magic links in console)
- Odoo (orders save to DB only)
- Sentry (error tracking)
- Google OAuth (email magic link works)

---

## 🚀 How to Test

### 1. Test Auth (Without SMTP)
```
1. Visit http://localhost:3000/auth/signin
2. Enter any email
3. Look in terminal for:
   🔗 Magic Link (SMTP not configured):
      Link: http://localhost:3000/api/auth/callback/email?token=xxx
4. Copy/paste link in browser
5. You're signed in!
```

### 2. Test Menu
```
Visit http://localhost:3000/menu

You should see:
✅ Menu loads with products
✅ Yellow banner: "Development Mode: Showing local menu data"
✅ All features work
```

### 3. Test Cart & Orders
```
1. Sign in (via console magic link)
2. Add items to cart
3. Place order
4. View /orders
```

---

## 📋 Service Status Checklist

Run these to check what's configured:

```bash
# Check Postgres
npx prisma db push

# Check Redis
redis-cli PING

# Check Odoo
curl http://localhost:3000/api/odoo/test

# Check Health
curl http://localhost:3000/api/health
```

---

## ✅ Everything Working?

If you see:
- ✅ `GET /menu 200` - Menu loads
- ✅ `GET / 200` - Homepage loads
- ✅ `GET /api/auth/session 200` - Auth works

**Your app is running correctly!**

The warnings/503 errors are expected in development without full setup.

---

## 📚 More Help

- **Development:** `docs/DEVELOPMENT_NOTES.md`
- **Full Setup:** `docs/AUTH_QUICKSTART.md`
- **Deployment:** `docs/DEPLOYMENT_GUIDE.md`

---

**Status:** App works in development with minimal setup ✅

