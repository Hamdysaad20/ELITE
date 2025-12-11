# Authentication System

> Comprehensive guide to ELITE's authentication implementation

## Overview

ELITE uses NextAuth.js v4 with multiple authentication providers:
- **Primary**: Magic Link (Email)
- **Secondary**: Email/Password
- **Social**: Google OAuth

---

## Authentication Flow

### Magic Link Flow (Primary)
```
1. User enters email
2. System generates magic link token
3. Email sent via Resend
4. User clicks link
5. Token verified
6. Session created
7. User redirected to dashboard
```

**Implementation**: `/src/app/api/auth/[...nextauth]/route.ts`

### Email/Password Flow (Fallback)
```
1. User enters email + password
2. Password hashed with bcrypt
3. Credentials verified
4. Session created
```

### Google OAuth Flow
```
1. User clicks "Continue with Google"
2. Redirected to Google consent
3. Google returns authorization
4. Profile data retrieved
5. User created/logged in
```

---

## Configuration

### NextAuth Configuration
```typescript
// /src/app/api/auth/[...nextauth]/route.ts
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        // Custom email template via Resend
        await sendMagicLinkEmail(identifier, url);
      },
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Verify email + password
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user?.password) return null;
        
        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        return valid ? user : null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create Odoo partner on first signup
      if (account?.provider && !user.odooPartnerId) {
        await syncUserToOdoo(user);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role || "USER";
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
      }
      
      // Handle profile updates
      if (trigger === "update" && session) {
        token.name = session.user?.name;
        token.picture = session.user?.image;
      }
      
      return token;
    },
  },
};
```

---

## Environment Variables

Required environment variables:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Email (Resend)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-resend-api-key
EMAIL_FROM=ELITE <noreply@yourdomain.com>
RESEND_API_KEY=re_xxx

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:pass@host/db
```

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete list.

---

## User Model

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For email/password auth
  phone         String?
  role          Role      @default(USER)
  
  // Loyalty System
  loyaltyPoints Int       @default(0)
  loyaltyTier   String    @default("Bronze")
  
  // Odoo Integration
  odooPartnerId Int?
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  orders        Order[]
  reviews       Review[]
  addresses     Address[]
  loyaltyAccount LoyaltyAccount?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

---

## Protected Routes

### Middleware Protection
```typescript
// /middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/profile/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/api/orders/:path*",
    "/api/addresses/:path*",
  ],
};
```

### API Route Protection
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Proceed with authenticated logic
}
```

### Client-Side Protection
```typescript
"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <LoadingSpinner />;
  }
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  return <ProtectedContent />;
}
```

---

## Odoo Partner Sync

When a user signs up, their profile is automatically synced to Odoo:

```typescript
// /src/app/api/auth/[...nextauth]/route.ts
async signIn({ user, account }) {
  if (account?.provider && !user.odooPartnerId) {
    try {
      const odooClient = createOdooClient();
      const partnerId = await odooClient.findOrCreatePartner({
        name: user.name || user.email,
        email: user.email,
      });
      
      await prisma.user.update({
        where: { id: user.id },
        data: { odooPartnerId: partnerId },
      });
    } catch (error) {
      console.error("Odoo sync failed:", error);
      // Don't block signup if Odoo fails
    }
  }
  return true;
}
```

---

## Session Management

### Session Structure
```typescript
interface Session {
  user: {
    id: string;
    name?: string;
    email: string;
    image?: string;
    role: "USER" | "ADMIN";
  };
  expires: string;
}
```

### Accessing Session

**Server Component**:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ServerPage() {
  const session = await getServerSession(authOptions);
  return <div>Welcome {session?.user?.name}</div>;
}
```

**Client Component**:
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session } = useSession();
  return <div>Welcome {session?.user?.name}</div>;
}
```

**API Route**:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

---

## Email Templates

### Magic Link Email
```typescript
// /src/server/utils/email.ts
export async function sendMagicLinkEmail(email: string, url: string) {
  await resend.emails.send({
    from: "ELITE <noreply@yourdomain.com>",
    to: email,
    subject: "Sign in to ELITE",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ELITE</h2>
        <p>Click the button below to sign in:</p>
        <a href="${url}" style="
          display: inline-block;
          background: #8B2635;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
        ">
          Sign In
        </a>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });
}
```

---

## Security Best Practices

### Password Hashing
```typescript
import bcrypt from "bcryptjs";

// Hash password on signup
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password on login
const isValid = await bcrypt.compare(password, user.password);
```

### CSRF Protection
- NextAuth.js includes built-in CSRF protection
- All state-changing requests require CSRF token

### Rate Limiting
```typescript
// Consider implementing rate limiting for auth endpoints
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
});
```

---

## Troubleshooting

### Common Issues

**Issue**: Magic link not received
- Check email provider configuration
- Verify Resend API key is valid
- Check spam folder
- Verify email templates are correct

**Issue**: "NEXTAUTH_SECRET not defined"
- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Generate: `openssl rand -base64 32`
- Restart dev server after adding

**Issue**: Session not persisting
- Check cookie settings in browser
- Verify `NEXTAUTH_URL` matches your domain
- Check session strategy in config

**Issue**: Google OAuth not working
- Verify Google OAuth credentials
- Check redirect URIs in Google Console
- Ensure scopes are correct

---

## Testing

### Test Authentication Flow
```bash
# Run auth test suite
npm run test:auth

# Test magic link
npm run test:magic-link
```

### Manual Testing Checklist
- [ ] Magic link signup
- [ ] Magic link signin
- [ ] Email/password signup
- [ ] Email/password signin
- [ ] Google OAuth
- [ ] Logout
- [ ] Session persistence
- [ ] Protected route access
- [ ] Odoo partner sync

---

## Related Documentation
- [API Reference](./API_REFERENCE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Odoo Integration](./ODOO_INTEGRATION.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
