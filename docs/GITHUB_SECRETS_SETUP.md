# GitHub Secrets Setup - Complete Guide

## 📋 All Environment Variables to Add

Add these secrets to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

---

## 🔴 Required Secrets (Must Have)

### Core API Configuration
1. **`VERCEL_URL`**
   - Value: Your production URL
   - Example: `https://www.officieleliteeg.com`
   - Used by: All workflows to call API endpoints

2. **`ADMIN_TOKEN`**
   - Value: Your admin token from `.env`
   - Example: `your-secret-admin-token-here`
   - Used by: All API endpoints for authentication

---

## 🟡 Odoo Configuration (Required for Scripts)

3. **`ODOO_HOST`**
   - Value: Your Odoo instance URL
   - Example: `https://your-odoo.odoo.com`
   - Used by: Odoo client, product sync, deal scripts

4. **`ODOO_DB`**
   - Value: Your Odoo database name
   - Example: `elite_production`
   - Used by: Odoo client connection

5. **`ODOO_USERNAME`**
   - Value: Your Odoo username/email
   - Example: `admin@elite.com`
   - Used by: Odoo authentication

6. **`ODOO_API_KEY`**
   - Value: Your Odoo API key
   - Example: `your-odoo-api-key`
   - Used by: Odoo authentication (preferred over password)

7. **`ODOO_PASSWORD`** (Optional - only if API key not available)
   - Value: Your Odoo password
   - Used by: Odoo authentication fallback

8. **`ODOO_TIMEOUT_MS`** (Optional)
   - Value: Timeout in milliseconds
   - Example: `60000` (60 seconds)
   - Default: 60000 if not set

9. **`ODOO_INSECURE_SSL`** (Optional)
   - Value: `true` or `false`
   - Default: `false`
   - Only set to `true` for local self-signed certificates

---

## 🟢 Database & Cache (Required for Scripts)

10. **`DATABASE_URL`**
    - Value: PostgreSQL connection string
    - Example: `postgresql://user:password@host:5432/elite`
    - Used by: Prisma, database operations

11. **`REDIS_URL`**
    - Value: Redis connection string
    - Example: `redis://localhost:6379` or `rediss://host:6379`
    - Used by: Product cache, queue management

---

## 🔵 NextAuth & Email (Optional)

12. **`NEXTAUTH_SECRET`**
    - Value: Secret for NextAuth session encryption
    - Example: `your-nextauth-secret-key`
    - Used by: Authentication system

13. **`EMAIL_SERVER_HOST`** (Optional)
    - Value: SMTP server hostname
    - Example: `smtp.gmail.com`
    - Used by: NextAuth magic-link emails

14. **`EMAIL_SERVER_PORT`** (Optional)
    - Value: SMTP port
    - Example: `587`
    - Used by: NextAuth magic-link emails

15. **`EMAIL_SERVER_USER`** (Optional)
    - Value: SMTP username
    - Example: `noreply@elite.com`
    - Used by: Email authentication

16. **`EMAIL_SERVER_PASSWORD`** (Optional)
    - Value: SMTP password
    - Example: `your-smtp-password`
    - Used by: Email authentication

17. **`EMAIL_FROM`** (Optional)
    - Value: From email address
    - Example: `contact@elite.com`
    - Used by: Email sender

18. **`BRAND_NAME`** (Optional)
    - Value: Brand name for emails
    - Example: `Elite Coffee Shop`
    - Used by: Email templates

---

## 🟣 Public Configuration (Optional)

19. **`NEXT_PUBLIC_API_BASE`** (Optional)
    - Value: Public API base URL
    - Example: `https://www.officieleliteeg.com/api`
    - Used by: Client-side API calls

20. **`NEXT_PUBLIC_APP_URL`** (Optional)
    - Value: Public app URL
    - Example: `https://www.officieleliteeg.com`
    - Used by: Client-side redirects

---

## 🟠 External Services (Optional)

21. **`CRON_SECRET`** (Optional - for Vercel cron backup)
    - Value: Secret for Vercel cron authentication
    - Example: `your-vercel-cron-secret`
    - Used by: Vercel cron jobs (backup)

22. **`NEXT_PUBLIC_SENTRY_DSN`** (Optional)
    - Value: Sentry DSN for error tracking
    - Example: `https://xxx@xxx.ingest.sentry.io/xxx`
    - Used by: Error tracking

23. **`SLACK_WEBHOOK_URL`** (Optional)
    - Value: Slack webhook URL for alerts
    - Example: `https://hooks.slack.com/services/xxx/xxx/xxx`
    - Used by: Alerting system

24. **`GOOGLE_CLIENT_ID`** (Optional)
    - Value: Google OAuth client ID
    - Example: `xxx.apps.googleusercontent.com`
    - Used by: Social login

25. **`GOOGLE_CLIENT_SECRET`** (Optional)
    - Value: Google OAuth client secret
    - Example: `your-google-secret`
    - Used by: Social login

26. **`SYNC_PRODUCTS_LIMIT`** (Optional)
    - Value: Maximum products to sync per run
    - Example: `500`
    - Default: No limit if not set

---

## 📝 Quick Setup Checklist

### Minimum Required (for basic functionality):
- [ ] `VERCEL_URL`
- [ ] `ADMIN_TOKEN`
- [ ] `ODOO_HOST`
- [ ] `ODOO_DB`
- [ ] `ODOO_USERNAME`
- [ ] `ODOO_API_KEY`
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`

### Recommended (for full functionality):
- [ ] All minimum required
- [ ] `NEXTAUTH_SECRET`
- [ ] `CRON_SECRET` (for Vercel backup)
- [ ] Email configuration (if using email features)

### Optional (for advanced features):
- [ ] External services (Sentry, Slack, Google OAuth)
- [ ] Public configuration
- [ ] Additional Odoo settings

---

## 🔒 Security Notes

1. **Never commit secrets to code** - Always use GitHub Secrets
2. **Rotate secrets regularly** - Update secrets periodically
3. **Use different secrets for dev/staging/prod** - Separate environments
4. **Limit access** - Only repository admins can view/edit secrets
5. **Audit regularly** - Review which secrets are actually used

---

## ✅ Verification

After adding secrets, verify they work:

1. Go to **Actions** tab
2. Select a workflow (e.g., "Sync Products from Odoo")
3. Click **Run workflow** → **Run workflow**
4. Check the logs to ensure no "missing environment variable" errors

---

## 🆘 Troubleshooting

### Secret Not Found Error
- Verify secret name matches exactly (case-sensitive)
- Check you're in the correct repository
- Ensure secret is added to repository (not organization) if needed

### Authentication Failed
- Verify `ADMIN_TOKEN` matches your `.env` file
- Check `ODOO_API_KEY` is correct
- Ensure `VERCEL_URL` includes `https://`

### Connection Errors
- Verify `ODOO_HOST` is accessible from internet
- Check `DATABASE_URL` and `REDIS_URL` are correct
- Ensure firewall allows GitHub Actions IPs

---

## 📚 Reference

- GitHub Secrets Docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Your `.env` file: `docs/ENV_EXAMPLE.md`

