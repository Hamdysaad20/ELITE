# Environment Variables (example)

```
# ---- Core runtime ----
NODE_ENV=development

# ---- Database (Postgres via Prisma) ----
DATABASE_URL=postgresql://user:password@localhost:5432/elite

# ---- Redis (catalog cache + BullMQ queue) ----
REDIS_URL=redis://localhost:6379

# ---- Odoo JSON-RPC ----
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key           # preferred over password on Odoo 19+
# ODOO_PASSWORD=optional_password_fallback
ODOO_TIMEOUT_MS=20000               # optional
ODOO_INSECURE_SSL=false             # set true only for local self-signed
# SYNC_PRODUCTS_LIMIT=500           # optional limit during sync

# ---- Admin token for protected endpoints (/api/sync/products) ----
ADMIN_TOKEN=change-me

# ---- NextAuth (email magic link) ----
NEXTAUTH_SECRET=replace-with-strong-secret
EMAIL_SERVER_HOST=smtp.yourprovider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_smtp_username
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=contact@jointhedragons.com

# ---- Next.js public client config ----
NEXT_PUBLIC_API_BASE=https://your-app.com/api
NEXT_PUBLIC_APP_URL=https://your-app.com

# ---- External Services (Optional) ----
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Slack Alerting (for critical auth events)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# Google OAuth (Social Login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

