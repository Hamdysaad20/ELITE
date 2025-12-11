# Authentication Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies

Already done! ✅

```bash
npm install
```

### Step 2: Set Environment Variables

Create `.env` file (or update existing):

```env
# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# For development, use Gmail
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com

# Already configured
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password
3. Copy and paste into `EMAIL_SERVER_PASSWORD`

### Step 3: Run Database Migration

```bash
npm run prisma:migrate
```

This will create all necessary tables including:
- User, Account, Session, VerificationToken
- LoyaltyAccount, Order, etc.

### Step 4: Create Admin User

After first sign-in, promote your account to admin:

```bash
npx prisma studio
```

1. Open User table
2. Find your user
3. Change `role` from `user` to `admin`

### Step 5: Start Services

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Development server
npm run dev
```

### Step 6: Test Authentication

1. Navigate to: `http://localhost:3000/auth/signin`
2. Enter your email
3. Check terminal for magic link (dev mode)
4. Click link to sign in

**In development**, magic links are also printed to console:
```
✅ Magic link sent to user@example.com
🔗 http://localhost:3000/api/auth/callback/email?token=...
```

---

## 📝 Integration Example

### Wrap Your App

```tsx
// app/layout.tsx
import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Use in Components

```tsx
// components/Header.tsx
"use client";

import { useAuth, useAuthActions } from "@/lib/auth/hooks";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { logout } = useAuthActions();

  if (!isAuthenticated) {
    return <a href="/auth/signin">Sign In</a>;
  }

  return (
    <div>
      <span>Welcome, {user.name || user.email}!</span>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```

### Protect Pages

```tsx
// app/dashboard/page.tsx
"use client";

import { useRequireAuth } from "@/lib/auth/hooks";

export default function DashboardPage() {
  const { user } = useRequireAuth(); // Auto-redirects if not signed in

  return <div>Dashboard for {user.name}</div>;
}
```

### Make Authenticated API Calls

```tsx
import { apiClient } from "@/lib/auth/apiClient";

// Old way (remove this)
fetch("/api/orders", {
  headers: { "x-user-id": userId }
});

// New way
const orders = await apiClient.get("/api/orders");
```

---

## 🔍 Test Checklist

- [ ] Magic link arrives in email (or check console in dev)
- [ ] Clicking link signs you in
- [ ] Session persists after page refresh
- [ ] Protected routes redirect to sign-in
- [ ] Admin endpoints work with admin role
- [ ] Sign out works
- [ ] Rate limiting works (try 6 magic link requests)

---

## 🐛 Common Issues

### Magic Links Not Sending

**Problem:** Email not arriving  
**Solution:** Check SMTP credentials and Gmail app password

```bash
# Test SMTP connection
node -e "require('nodemailer').createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
}).verify().then(console.log).catch(console.error)"
```

### Session Not Persisting

**Problem:** Keep getting redirected to sign-in  
**Solution:** Check `NEXTAUTH_SECRET` is set

```bash
# Generate new secret
openssl rand -base64 32
```

### Rate Limit Too Strict

**Problem:** Can't sign in after a few attempts  
**Solution:** Clear Redis or adjust limit

```bash
# Clear rate limit for your email
redis-cli DEL "ratelimit:auth:magiclink:your-email@example.com"
```

### Redis Connection Error

**Problem:** Can't connect to Redis  
**Solution:** Start Redis server

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows
redis-server
```

---

## 📚 Learn More

- **Full Guide:** `docs/AUTH_SYSTEM_V1.md`
- **API Reference:** `docs/API_CONTRACT_V1.md`
- **NextAuth Docs:** https://next-auth.js.org
- **Security:** `docs/AUTH_COMPLETE.md`

---

## 🎯 Production Deployment

Before deploying:

1. **Set production NEXTAUTH_SECRET** (different from dev)
2. **Use production SMTP** (SendGrid, AWS SES, etc.)
3. **Set NEXTAUTH_URL** to your domain
4. **Enable NODE_ENV=production**
5. **Run migrations** on production DB
6. **Create admin user** via Prisma Studio

See `docs/AUTH_SYSTEM_V1.md` for complete production checklist.

---

**Status:** ✅ Ready to use  
**Next:** Start coding with authentication!

