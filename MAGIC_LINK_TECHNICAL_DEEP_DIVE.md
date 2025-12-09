# Magic Link Email System - Technical Deep Dive

## Current Status Check

### What's Configured ✅
- NextAuth.js: **CONFIGURED**
- Email Provider: **CONFIGURED** 
- SMTP Host (Gmail): **CONFIGURED** (smtp.gmail.com:587)
- Email Account: **CONFIGURED** (contact@jointhedragons.com)
- Rate Limiting: **CONFIGURED** (Redis + 5/hour)
- Email Templates: **CONFIGURED** (HTML & text)
- Database: **CONFIGURED** (Prisma + Postgres)
- Frontend Pages: **CONFIGURED** (/auth/signin, /auth/verify-request)

### What's Missing ❌
- **EMAIL_SERVER_PASSWORD** - **NOT SET**

---

## Detailed Code Flow

### 1. User Clicks "Sign In"

**File:** `/src/app/auth/signin/page.tsx`

```typescript
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  const result = await signIn("email", {
    email,
    callbackUrl,
    redirect: false,
  });
  
  // After signIn called:
  router.push("/auth/verify-request?email=" + encodeURIComponent(email));
};
```

**Result:** User sent to verify-request page

---

### 2. NextAuth Email Provider Triggered

**File:** `/src/app/api/auth/[...nextauth]/route.ts` (lines 90-205)

```typescript
EmailProvider({
  server: {
    host: "smtp.gmail.com",           // ✅
    port: 587,                         // ✅
    auth: {
      user: "contact@jointhedragons.com", // ✅
      pass: process.env.EMAIL_SERVER_PASSWORD, // ❌ undefined!
    },
  },
  
  sendVerificationRequest: async ({ identifier, url, provider }) => {
    if (!transporter) {
      if (process.env.NODE_ENV === "development") {
        // 🔗 CURRENT BEHAVIOR: Prints to console
        console.log("\n🔗 Magic Link (SMTP not configured):");
        console.log(`   Email: ${identifier}`);
        console.log(`   Link: ${url}\n`);
        return; // ← Exit without sending email
      }
    }
    
    // This part never runs because transporter is null
    // (password is missing, so transporter creation failed)
    
    await transporter.sendMail({
      to: identifier,
      from: provider.from,
      subject: "Sign in to Elite Coffee Shop",
      text: generateMagicLinkText(...),
      html: generateMagicLinkHtml(...),
    });
  },
})
```

**Current Result:** Magic link printed to console, not emailed

---

### 3. What Should Happen (With Password)

**Step 3a: Create Transporter**

```typescript
const transporter = 
  EMAIL_SERVER_HOST && EMAIL_SERVER_USER && EMAIL_SERVER_PASSWORD
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // TLS, not SSL
        auth: {
          user: "contact@jointhedragons.com",
          pass: "xyzwabcd1234efgh", // ✅ From .env
        },
      })
    : null;
```

**Result:** `transporter` is created ✅

---

**Step 3b: Verify SMTP Connection**

```typescript
if (transporter && process.env.NODE_ENV === "development") {
  transporter.verify((error) => {
    if (!error) {
      console.log("✅ SMTP connection verified successfully");
    }
  });
}
```

**Result:** Console shows ✅ SMTP verified

---

**Step 3c: Check Rate Limit**

```typescript
const rateLimitResult = await enforceRateLimit(
  identifier, // email address
  AUTH_RATE_LIMITS.MAGIC_LINK, // { maxRequests: 5, timeWindow: 3600s }
);

if (!rateLimitResult.allowed) {
  throw new Error(rateLimitResult.error);
  // "Too many magic link requests. Try again in X minutes."
}
```

**Uses Redis key:** `ratelimit:auth:magiclink:user@example.com`

---

**Step 3d: Generate Email Content**

```typescript
const html = generateMagicLinkHtml({
  url: "http://localhost:3000/api/auth/callback/email?token=abc123&email=user%40gmail.com",
  host: "localhost:3000",
  email: "user@gmail.com",
  brandName: "Elite Coffee Shop",
  expiresIn: "24 hours",
});

const text = generateMagicLinkText({ /* same data */ });

const subject = generateMagicLinkSubject("Elite Coffee Shop");
// Returns: "Sign in to Elite Coffee Shop"
```

---

**Step 3e: Send Email**

```typescript
await transporter.sendMail({
  to: "user@gmail.com",
  from: "contact@jointhedragons.com",
  subject: "Sign in to Elite Coffee Shop",
  text: "Click here: http://localhost:3000/api/auth/callback/email?token=...",
  html: "<html>...</html>",
});

console.log(`✅ Magic link sent to user@gmail.com`);
```

**Result:** Email delivered to user's inbox ✅

---

**Step 3f: User Clicks Link**

```
User clicks email link:
http://localhost:3000/api/auth/callback/email?token=abc123&email=user@gmail.com

↓

NextAuth verifies token (from database)

↓

Creates session with JWT

↓

Redirects to home page (or callbackUrl)

↓

User logged in! ✅
```

---

## Database Schema

### VerificationToken Table
Used by NextAuth to store magic link tokens:

```typescript
// From prisma/schema.prisma
model VerificationToken {
  identifier String  // Email address
  token      String  // Token hash
  expires    DateTime // Expiry time (24 hours)

  @@unique([identifier, token])
  @@index([identifier])
}
```

**Record example:**
```
identifier: user@gmail.com
token: abc123def456ghi789jkl (hashed)
expires: 2024-12-10 15:30:00 UTC
```

---

## Environment Variables Required

### Current Status:
```env
NODE_ENV=development                    ✅
DATABASE_URL=...                        ✅
REDIS_URL=...                           ✅
NEXTAUTH_SECRET=...                     ✅
EMAIL_SERVER_HOST=smtp.gmail.com        ✅
EMAIL_SERVER_PORT=587                   ✅
EMAIL_SERVER_USER=contact@...           ✅
EMAIL_SERVER_PASSWORD=???               ❌ MISSING
EMAIL_FROM=contact@...                  ✅
```

---

## Console Output Examples

### When Password is MISSING (Current):
```
🔗 Magic Link (SMTP not configured):
   Email: test@example.com
   Link: http://localhost:3000/api/auth/callback/email?token=abc123&email=test%40example.com
```

### When Password is SET (Expected):
```
✅ SMTP connection verified successfully
✅ Magic link sent to test@example.com
```

---

## Testing the System

### Manual Test Steps:

1. **Start dev server**
   ```bash
   cd /Users/hamdysaad/ELITE
   npm run dev
   ```

2. **Visit sign-in page**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Enter email**
   ```
   test@example.com
   ```

4. **Check server console**
   - If no password: prints magic link
   - If password set: confirms email sent

5. **Verify database**
   ```bash
   # Check if token was created
   npx prisma studio
   # Look at VerificationToken table
   ```

6. **Test email receipt**
   - Without password: Use console link
   - With password: Check inbox for email

7. **Click verification link**
   - Should redirect to home
   - User should be logged in

---

## Troubleshooting

### Issue: "Magic link didn't arrive"

**Check 1: Is password set?**
```bash
grep "EMAIL_SERVER_PASSWORD" /Users/hamdysaad/ELITE/.env
```
Should NOT show `# ` at start

**Check 2: Is Gmail app password?**
- If using regular password → Won't work
- Must be 16-character app password
- Generate at: https://myaccount.google.com/apppasswords

**Check 3: Is 2FA enabled?**
- Required for Gmail app passwords
- Enable at: https://myaccount.google.com/security

**Check 4: Check server logs**
```bash
# Look for error messages:
# - "Failed to send magic link"
# - "SMTP connection refused"
# - "EAUTH Invalid credentials"
```

### Issue: "EAUTH Invalid credentials"
- Wrong password
- Gmail account locked
- 2FA not enabled

### Issue: "SMTP connection refused"
- Host not reachable
- Port wrong (should be 587)
- Firewall issue

---

## Security Features

### 1. Token Security
- Tokens are cryptographically hashed in database
- Single-use only (deleted after verification)
- Expires in 24 hours

### 2. Rate Limiting
- 5 magic links per hour per email
- Uses Redis for distributed tracking
- Rate limit enforced before sending

### 3. Session Security
- JWT signed with NEXTAUTH_SECRET
- 30-day session duration
- Updates every 24 hours

### 4. Email Validation
- Email required for sign-in
- Prevents invalid email format
- Spam folder handling documented

---

## Files to Review

### Core
- `/src/app/api/auth/[...nextauth]/route.ts` - Main auth config
- `/src/app/auth/signin/page.tsx` - Sign-in form
- `/src/app/auth/verify-request/page.tsx` - Verification page

### Utilities
- `/src/server/auth/emailTemplates.ts` - Email generator
- `/src/server/auth/rateLimit.ts` - Rate limiting logic
- `/src/server/auth/logger.ts` - Event logging
- `/prisma/schema.prisma` - Database schema

### Configuration
- `.env` - Environment variables
- `next.config.js` - Next.js config

---

## Summary

**Password Status:** ❌ Missing from `.env`
**Impact:** Emails not being sent (printed to console instead)
**Fix:** Add `EMAIL_SERVER_PASSWORD` to `.env`
**Time to Fix:** < 5 minutes
**Testing:** Visit http://localhost:3000/auth/signin and test flow
