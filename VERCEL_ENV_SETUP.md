# Vercel Environment Variables Setup

## Required Environment Variables

### NextAuth Configuration
```bash
# CRITICAL: Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Production URL
NEXTAUTH_URL=https://www.officieleliteeg.com
```

### Email Configuration (for Magic Links)
```bash
# Using Resend (recommended)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_your_api_key_here
EMAIL_FROM=Elite <noreply@officieleliteeg.com>

# OR using Gmail
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-specific-password
EMAIL_FROM=Elite Coffee <your-email@gmail.com>
```

### Database
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Redis (Upstash)
```bash
REDIS_URL=redis://default:password@host:port
```

### Odoo (Optional)
```bash
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your_database
ODOO_USERNAME=admin@yourdomain.com
ODOO_PASSWORD=your-password
```

### Google OAuth (Optional)
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Cloudinary (Optional)
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Quick Setup in Vercel

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add each variable listed above
4. Make sure to add them for **Production**, **Preview**, and **Development**
5. Redeploy after adding variables

## Check Configuration

Visit: `https://your-domain.com/api/auth/check`

This will show which environment variables are properly configured.

## Troubleshooting Sign-In Issues

### Issue: Can't sign in, no error shown
**Cause**: NEXTAUTH_SECRET not set or using placeholder
**Fix**: 
1. Generate secret: `openssl rand -base64 32`
2. Add to Vercel environment variables
3. Redeploy

### Issue: Magic link not received
**Cause**: Email configuration missing or incorrect
**Fix**:
1. Verify all EMAIL_SERVER_* variables are set
2. Test email credentials
3. Check spam folder
4. Use Resend for reliable delivery

### Issue: "Email transport is not configured"
**Cause**: EMAIL_SERVER_* variables not set
**Fix**: Add all required email variables to Vercel

## Testing

After setting environment variables:

1. Check health: `/api/auth/check`
2. Try sign in: `/auth/signin`
3. Check browser console for detailed errors
4. Check Vercel logs for server-side errors
