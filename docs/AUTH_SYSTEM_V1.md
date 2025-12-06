# Authentication System V1 - Production Guide

## Overview

Elite Coffee Shop uses **NextAuth.js** with passwordless email authentication (magic links) for a secure, modern, and user-friendly authentication experience.

### Key Features

- ✅ **Passwordless Authentication** - Magic link via email
- ✅ **JWT-based Sessions** - Stateless, serverless-friendly
- ✅ **Redis Rate Limiting** - Prevents abuse (5 magic links/hour per email)
- ✅ **Production Email Templates** - Professional HTML + text emails
- ✅ **Comprehensive Logging** - Security audit trail
- ✅ **Role-based Access Control** - User and Admin roles
- ✅ **Account Management** - Profile updates, account deletion
- ✅ **Middleware Protection** - Route-level authentication
- ✅ **Security Headers** - CSP, XSS protection, frame guards

---

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React Hooks)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│   NextAuth.js   │─────▶│   Postgres   │
│  /api/auth/*    │      │   (Prisma)   │
└────────┬────────┘      └──────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐  ┌──────────────┐
│   SMTP Server   │  │    Redis     │
│  (Email Send)   │  │ (Rate Limit) │
└─────────────────┘  └──────────────┘
```

---

## Environment Setup

### Required Environment Variables

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Email (SMTP) Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Branding
BRAND_NAME="Elite Coffee Shop"

# Database (Prisma)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379
```

### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

### SMTP Providers

#### Gmail
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=<app-password>  # Generate at https://myaccount.google.com/apppasswords
```

#### SendGrid
```env
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=<your-sendgrid-api-key>
```

#### AWS SES
```env
EMAIL_SERVER_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=<your-smtp-username>
EMAIL_SERVER_PASSWORD=<your-smtp-password>
```

---

## Database Schema

Run migrations to set up auth tables:

```bash
npm run prisma:migrate
```

### Key Models

- **User** - Core user account
- **Account** - OAuth provider accounts (future)
- **Session** - Active sessions (database strategy)
- **VerificationToken** - Magic link tokens
- **LoyaltyAccount** - User loyalty points (auto-created on signup)

---

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET/POST | NextAuth sign-in page |
| `/api/auth/callback/email` | GET | Magic link callback |
| `/api/auth/signout` | POST | Sign out |
| `/api/auth/session` | GET | Get current session |

### Protected Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/profile` | GET | Required | Get user profile |
| `/api/auth/profile` | PATCH | Required | Update profile |
| `/api/auth/profile` | DELETE | Required | Delete account |
| `/api/auth/me` | GET | Required | Get current user |

### Admin Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/users/:id` | GET | Admin | Get user details |
| `/api/admin/users/:id` | PATCH | Admin | Update user (role, status) |
| `/api/admin/users/:id` | DELETE | Admin | Delete user |

---

## Frontend Integration

### 1. Setup Auth Provider

Wrap your app with the `AuthProvider` in your root layout:

```tsx
// app/layout.tsx
import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use Auth Hooks

```tsx
import { useAuth, useAuthActions } from "@/lib/auth/hooks";

function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { login, logout } = useAuthActions();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={() => login({ email: "user@example.com" })}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```

### 3. Protect Pages

```tsx
import { useRequireAuth } from "@/lib/auth/hooks";

function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Secret content for {user.name}</div>;
}
```

### 4. Role-based Access

```tsx
import { useRole } from "@/lib/auth/hooks";

function AdminPanel() {
  const { hasRole, isLoading } = useRole();

  if (isLoading) return <Spinner />;

  if (!hasRole("admin")) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Dashboard</div>;
}
```

### 5. API Calls with Auth

```tsx
import { apiClient } from "@/lib/auth/apiClient";

async function fetchOrders() {
  try {
    const orders = await apiClient.get("/api/orders");
    console.log(orders);
  } catch (error) {
    if (error.isUnauthorized) {
      // Redirect to login
    }
  }
}
```

---

## Security Features

### 1. Rate Limiting

Magic link requests are rate-limited to **5 per hour per email address** using Redis.

**Configuration:**
```typescript
// src/server/auth/rateLimit.ts
export const AUTH_RATE_LIMITS = {
  MAGIC_LINK: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyPrefix: "ratelimit:auth:magiclink",
  },
};
```

### 2. Security Headers

Middleware automatically adds security headers:

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Content-Security-Policy` - CSP rules
- `Referrer-Policy` - Control referrer info

### 3. Session Security

- **JWT-based** - Stateless, no server-side session store
- **30-day expiration** - Auto-refresh every 24 hours
- **Secure cookies** - HttpOnly, Secure (production), SameSite=lax
- **Token rotation** - Automatic on session updates

### 4. Email Token Security

- **Single-use tokens** - Invalidated after first use
- **24-hour expiration** - Automatic cleanup
- **Cryptographically secure** - NextAuth handles generation

---

## Logging & Monitoring

All auth events are logged with context:

```typescript
// Example log output
{
  "timestamp": "2024-12-05T10:30:00.000Z",
  "event": "auth.signin.success",
  "context": {
    "userId": "usr_123",
    "email": "u***@example.com",
    "ip": "203.0.113.1"
  },
  "severity": "info"
}
```

### Logged Events

- Sign-in started/success/failed
- Magic link sent/clicked/expired/invalid
- Session created/updated/expired/revoked
- Account created/updated/deleted/suspended
- Rate limit exceeded
- Suspicious activity detected

---

## User Roles & Status

### Roles

- **user** (default) - Standard user with access to orders, cart, profile
- **admin** - Full access including user management, sync triggers

### Status

- **active** (default) - Normal account
- **suspended** - Account temporarily disabled
- **deleted** - Soft-deleted account (email anonymized)

---

## Admin Operations

### Suspend User

```typescript
// Manual suspension
await prisma.user.update({
  where: { id: userId },
  data: { status: "suspended" },
});
```

Via API:
```bash
PATCH /api/admin/users/:id
{
  "status": "suspended"
}
```

### Delete User

Soft delete (preserves order history):

```bash
DELETE /api/admin/users/:id
```

---

## Troubleshooting

### Magic Links Not Sending

1. Check SMTP credentials:
   ```bash
   # Test SMTP connection
   node -e "require('nodemailer').createTransport({host:'smtp.gmail.com',port:587,auth:{user:'***',pass:'***'}}).verify().then(console.log).catch(console.error)"
   ```

2. Check logs:
   ```bash
   # Look for "❌ SMTP connection failed"
   npm run dev
   ```

3. Verify environment variables:
   ```bash
   echo $EMAIL_SERVER_HOST
   echo $EMAIL_SERVER_USER
   ```

### Rate Limit Issues

Clear rate limit for specific email:
```bash
redis-cli DEL "ratelimit:auth:magiclink:user@example.com"
```

### Session Not Persisting

1. Ensure `NEXTAUTH_SECRET` is set
2. Check cookie settings in browser DevTools
3. Verify `credentials: "include"` in API calls

---

## Migration from Old Auth

If migrating from custom JWT/Auth0:

1. ✅ Old endpoints removed:
   - `/api/auth/login` (custom)
   - `/api/auth/verify` (custom)
   - `/api/auth/auth0` helper

2. ✅ Use NextAuth endpoints:
   - `/api/auth/[...nextauth]` (NextAuth handler)

3. ✅ Update frontend:
   - Replace `x-user-id` header with NextAuth session
   - Use `useAuth()` hooks instead of custom auth

---

## Production Checklist

- [ ] Set `NEXTAUTH_SECRET` (production secret)
- [ ] Configure production SMTP server
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Enable secure cookies (`NODE_ENV=production`)
- [ ] Configure Redis for rate limiting
- [ ] Set up monitoring/alerts for auth events
- [ ] Test magic link flow end-to-end
- [ ] Verify security headers in browser DevTools
- [ ] Test rate limiting (send 6 magic links)
- [ ] Create admin account manually in DB
- [ ] Document admin procedures

---

## Support

For issues or questions:
1. Check logs: `npm run dev` or production logs
2. Review NextAuth docs: https://next-auth.js.org
3. Check Redis connection: `redis-cli PING`
4. Verify Prisma migrations: `npx prisma migrate status`

---

**Last Updated:** December 5, 2024

