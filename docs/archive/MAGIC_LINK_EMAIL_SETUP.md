# Magic Link Email Setup - Complete Analysis

## Problem Identified
**The magic links are not being sent because the `EMAIL_SERVER_PASSWORD` is missing/commented out in `.env`**

```env
# .env line 66 (CURRENTLY COMMENTED OUT):
# EMAIL_SERVER_PASSWORD=a9/9oFc856f9/{(ba
```

## How the Magic Link System Works

### 1. **User Flow**
```
User Signs In → SignIn Page (/auth/signin)
              ↓
              Submits Email
              ↓
              NextAuth Email Provider triggers
              ↓
              sendVerificationRequest() called
              ↓
              Magic link sent via SMTP
              ↓
              User redirected to /auth/verify-request?email=...
              ↓
              User checks email for magic link
              ↓
              User clicks link in email
              ↓
              User authenticated and logged in
```

### 2. **Current Configuration**

**Location:** `/src/app/api/auth/[...nextauth]/route.ts`

**Email Provider Setup:**
```typescript
EmailProvider({
  server: {
    host: EMAIL_SERVER_HOST,        // smtp.gmail.com
    port: EMAIL_SERVER_PORT,        // 587
    auth: {
      user: EMAIL_SERVER_USER,      // contact@jointhedragons.com
      pass: EMAIL_SERVER_PASSWORD,  // ❌ MISSING/COMMENTED OUT
    },
  },
  from: EMAIL_FROM,                 // contact@jointhedragons.com
  maxAge: 24 * 60 * 60,             // 24 hours validity
  sendVerificationRequest: async (...) => {
    // Sends magic link via nodemailer
  },
})
```

### 3. **Current Environment Variables**

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=contact@jointhedragons.com
# EMAIL_SERVER_PASSWORD=a9/9oFc856f9/{(ba  ← COMMENTED OUT!
EMAIL_FROM=contact@jointhedragons.com
```

### 4. **What Happens When PASSWORD is Missing**

**In Development Mode:**
```typescript
// From route.ts lines 109-115
if (!transporter) {
  if (process.env.NODE_ENV === "development") {
    console.log("\n🔗 Magic Link (SMTP not configured):");
    console.log(`   Email: ${identifier}`);
    console.log(`   Link: ${url}\n`);
    return; // Prints to console instead of sending
  }
}
```

**Result:** Magic link appears in server console, NOT sent to email
- ❌ User receives no email
- ✅ Magic link is logged in console
- ✅ User can see it during development
- ❌ Unusable in production

### 5. **Email Sending Code Flow**

**Location:** `/src/server/auth/emailTemplates.ts`

Steps:
1. **Generate Email Content**
   - `generateMagicLinkHtml()` - Creates HTML email template
   - `generateMagicLinkText()` - Creates plain text version
   - `generateMagicLinkSubject()` - Creates subject line

2. **Rate Limiting Check**
   - `enforceRateLimit()` checks: 5 magic links per hour per email
   - Location: `/src/server/auth/rateLimit.ts`

3. **Send Email via Nodemailer**
   ```typescript
   await transporter.sendMail({
     to: identifier,                // user@example.com
     from: provider.from,           // contact@jointhedragons.com
     subject,                       // "Sign in to Elite Coffee Shop"
     text,                          // Plain text version
     html,                          // HTML version
   });
   ```

4. **Log Event**
   - `logAuthEvent(AuthEvent.MAGIC_LINK_SENT, ...)`
   - Location: `/src/server/auth/logger.ts`

### 6. **Rate Limiting Configuration**

**File:** `/src/server/auth/rateLimit.ts` (lines 71-75)

```typescript
MAGIC_LINK: {
  maxRequests: 5,              // 5 magic links per hour
  timeWindowSeconds: 3600,     // 1 hour
  keyPrefix: "ratelimit:auth:magiclink",
},
```

Uses Redis to track requests:
- Key format: `ratelimit:auth:magiclink:user@example.com`
- Sliding window: 1 hour
- After 5 requests, must wait 1 hour before trying again

### 7. **NextAuth Configuration**

**File:** `/src/app/api/auth/[...nextauth]/route.ts`

**Session & JWT:**
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,  // 30 days
  updateAge: 24 * 60 * 60,    // refresh every 24 hours
},

jwt: {
  maxAge: 30 * 24 * 60 * 60,  // 30 days
},
```

**Auth Pages:**
```typescript
pages: {
  signIn: "/auth/signin",              // Email entry
  verifyRequest: "/auth/verify-request", // "Check your email" page
  error: "/auth/error",                // Error page
},
```

### 8. **Email Template Structure**

**HTML Template includes:**
- Elite Coffee Shop branding
- Magic link button with URL
- Expiry information (24 hours)
- Security messaging
- Footer with legal/support info

**Text Template includes:**
- Plain text version with clickable link
- Expiry info
- Security messaging

### 9. **Google SMTP Configuration Details**

Current setup uses Gmail SMTP:
```
Host: smtp.gmail.com
Port: 587 (TLS - not SSL)
User: contact@jointhedragons.com
Password: [NEEDS TO BE SET]
```

**For Gmail:**
- Regular passwords don't work with SMTP
- Must use "App Password" (16 characters)
- Generate at: https://myaccount.google.com/apppasswords
- Requires 2FA enabled on account

---

## SOLUTION: How to Fix

### Option 1: Enable Email Sending (Recommended)

1. **Generate Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the generated 16-character password

2. **Update `.env` file:**
   ```env
   EMAIL_SERVER_PASSWORD=<your-16-character-app-password>
   ```

3. **Restart development server**
   ```bash
   npm run dev
   ```

4. **Test:**
   - Go to http://localhost:3000/auth/signin
   - Enter an email
   - Check that email for the magic link
   - Click link to verify authentication

### Option 2: Continue Development Without Emails

If you want to keep using console output:

1. **Check server console when user signs in:**
   ```
   🔗 Magic Link (SMTP not configured):
      Email: user@example.com
      Link: http://localhost:3000/api/auth/callback/email?token=abc123&email=user@example.com
   ```

2. **Copy and paste the link into browser**
   - Manually visit the callback URL
   - User will be authenticated

---

## Files Involved in Magic Link System

### Core Authentication
- `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `/src/app/auth/signin/page.tsx` - Email entry form
- `/src/app/auth/verify-request/page.tsx` - "Check email" page

### Supporting Modules
- `/src/server/auth/emailTemplates.ts` - Email HTML/text generators
- `/src/server/auth/logger.ts` - Auth event logging
- `/src/server/auth/rateLimit.ts` - Rate limiting (Redis)

### Database
- Prisma Schema (VerificationToken table)
- User & Account tables for account linking

### Environment
- `.env` - SMTP credentials
- `NEXTAUTH_SECRET` - JWT signing key

---

## Debugging Checklist

- [ ] `EMAIL_SERVER_PASSWORD` is set in `.env`
- [ ] `EMAIL_SERVER_HOST` = `smtp.gmail.com`
- [ ] `EMAIL_SERVER_PORT` = `587`
- [ ] `EMAIL_SERVER_USER` = valid Gmail/SMTP account
- [ ] Gmail account has 2FA enabled (for app passwords)
- [ ] `NEXTAUTH_SECRET` is set
- [ ] Redis connection works (for rate limiting)
- [ ] Database connected (Prisma)
- [ ] Development server running: `npm run dev`

---

## Testing Magic Links in Development

```bash
# 1. Start dev server
npm run dev

# 2. Visit sign in page
open http://localhost:3000/auth/signin

# 3. Enter test email
# If SMTP not configured:
#   → Check server console for magic link
# If SMTP configured:
#   → Check email inbox for magic link

# 4. Click the link or manually visit URL
# 5. Should be logged in and redirected
```

---

## Production Considerations

For https://www.officieleliteeg.com:

1. **Environment variables on Vercel/hosting platform:**
   - Set `EMAIL_SERVER_PASSWORD` in production environment
   - Set `NEXTAUTH_URL` = `https://www.officieleliteeg.com`
   - Set `NEXTAUTH_SECRET` (different from dev)

2. **Alternative email providers:**
   - SendGrid
   - Resend
   - AWS SES
   - Mailgun

3. **Email deliverability:**
   - SPF/DKIM/DMARC records
   - Warm up sending quota
   - Monitor bounce rates

---

## Summary

**Current Status:** ❌ Magic links not sending (password missing)
**Fix:** Add `EMAIL_SERVER_PASSWORD` to `.env`
**Fallback:** Check console for magic link in development mode
