# Production Deployment Guide

Complete guide for deploying Elite Coffee Shop to production.

---

## 📋 Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested locally
- [ ] No linter errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Environment variables documented
- [ ] Sensitive data removed from code

### 2. Database Setup
- [ ] Postgres database provisioned
- [ ] Connection string obtained
- [ ] Migrations tested locally
- [ ] Backup strategy defined

### 3. Redis Setup
- [ ] Redis instance provisioned
- [ ] Connection string obtained
- [ ] Persistence configured (RDB/AOF)
- [ ] Memory limits set

### 4. Email Configuration
- [ ] SMTP provider chosen (SendGrid/SES/Gmail)
- [ ] API keys/credentials obtained
- [ ] Email templates tested
- [ ] Sender domain verified

### 5. Odoo Integration (Optional)
- [ ] Odoo instance accessible
- [ ] API key generated
- [ ] Test connection successful
- [ ] Product sync tested

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Prepare Repository
```bash
# Commit all changes
git add .
git commit -m "Production ready"
git push origin main
```

#### Step 2: Connect to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure project settings

#### Step 3: Add Environment Variables
In Vercel dashboard, add:

```bash
# NextAuth
NEXTAUTH_SECRET=<generate-new-secret>
NEXTAUTH_URL=https://your-domain.vercel.app

# Database (Vercel Postgres or external)
DATABASE_URL=<postgres-connection-string>

# Redis (Upstash recommended)
REDIS_URL=<redis-connection-string>

# SMTP
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@your-domain.com

# Odoo (optional)
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key

# Node
NODE_ENV=production
```

#### Step 4: Deploy
```bash
# Vercel will automatically deploy on push
# Or manually trigger:
vercel --prod
```

#### Step 5: Run Migrations
```bash
# After first deployment
npx prisma migrate deploy
```

#### Step 6: Create Admin User
1. Visit your deployed site
2. Sign in with your email
3. Access database (Vercel Postgres dashboard or Prisma Studio)
4. Update user role to 'admin'

#### Step 7: Verify Cron Job
The `vercel.json` configures automatic product sync every 10 minutes.
Verify in Vercel dashboard under "Cron Jobs".

---

### Option 2: Docker + Cloud Run / AWS / DigitalOcean

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Build and Push
```bash
# Build image
docker build -t elite-coffee:latest .

# Tag for registry
docker tag elite-coffee:latest gcr.io/your-project/elite-coffee:latest

# Push to registry
docker push gcr.io/your-project/elite-coffee:latest
```

#### Step 3: Deploy to Cloud Run
```bash
gcloud run deploy elite-coffee \
  --image gcr.io/your-project/elite-coffee:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXTAUTH_SECRET=...,DATABASE_URL=...,REDIS_URL=..."
```

#### Step 4: Deploy Worker (Separate Service)
```bash
# Create worker Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "worker:odoo"]

# Deploy worker
gcloud run deploy elite-coffee-worker \
  --image gcr.io/your-project/elite-coffee-worker:latest \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars "DATABASE_URL=...,REDIS_URL=...,ODOO_HOST=..."
```

---

## 🔧 Service Configuration

### Vercel Integrations

#### 1. Vercel Postgres
```bash
# Install integration from Vercel dashboard
# Automatically sets DATABASE_URL
```

#### 2. Upstash Redis
```bash
# Install integration from Vercel dashboard
# Automatically sets REDIS_URL
```

### External Services

#### 1. SendGrid (Email)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Verify sender domain
4. Set environment variables:
   ```bash
   EMAIL_SERVER_HOST=smtp.sendgrid.net
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=apikey
   EMAIL_SERVER_PASSWORD=<your-api-key>
   ```

#### 2. AWS SES (Email)
1. Sign up for AWS SES
2. Verify email address/domain
3. Create SMTP credentials
4. Set environment variables:
   ```bash
   EMAIL_SERVER_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=<smtp-username>
   EMAIL_SERVER_PASSWORD=<smtp-password>
   ```

#### 3. Planetscale (Database)
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Set `DATABASE_URL`

#### 4. Upstash (Redis)
1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database
3. Get connection string
4. Set `REDIS_URL`

---

## 🔒 Security Hardening

### 1. Environment Variables
```bash
# Generate strong secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

### 2. Database Security
- Enable SSL connections
- Use connection pooling
- Set up read replicas for scaling
- Regular backups

### 3. Redis Security
- Enable password authentication
- Use TLS connections
- Set memory limits
- Configure eviction policies

### 4. Rate Limiting
Already configured in code:
- 5 magic links per hour per email
- Adjustable in `src/server/auth/rateLimit.ts`

### 5. CORS Configuration
```typescript
// middleware.ts already includes security headers
// Adjust as needed for your domain
```

---

## 📊 Monitoring & Observability

### 1. Logging
```bash
# Production logs are JSON formatted
# Integrate with:
# - DataDog
# - CloudWatch
# - Logtail
# - Sentry
```

### 2. Error Tracking
```bash
# Add Sentry integration
npm install @sentry/nextjs

# Initialize in next.config.js
```

### 3. Uptime Monitoring
- Use Vercel Analytics (built-in)
- Or external: UptimeRobot, Pingdom

### 4. Performance Monitoring
- Vercel Speed Insights
- Google Analytics
- Custom metrics via `/api/health`

---

## 🔄 Post-Deployment Tasks

### 1. Database Migration
```bash
# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db push --preview-feature
```

### 2. Create Admin User
```bash
# Option 1: Prisma Studio
npx prisma studio

# Option 2: SQL
psql $DATABASE_URL -c "UPDATE \"User\" SET role='admin' WHERE email='admin@example.com';"
```

### 3. Trigger Initial Sync
```bash
# Call sync endpoint (requires admin auth)
curl -X POST https://your-domain.com/api/sync/products \
  -H "Cookie: next-auth.session-token=<admin-token>"
```

### 4. Test Authentication Flow
1. Visit `/auth/signin`
2. Request magic link
3. Check email delivery
4. Click link and verify sign-in
5. Test rate limiting (6 requests)

### 5. Verify Cron Job
- Check Vercel dashboard for cron execution
- Monitor `/api/sync/status` endpoint
- Verify products are syncing

### 6. Test Order Flow
1. Add items to cart
2. Place order
3. Verify order in database
4. Check Odoo sync status
5. Verify BullMQ worker processing

---

## 🐛 Troubleshooting

### Deployment Fails

**Build Error:**
```bash
# Check build logs
vercel logs <deployment-url>

# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Prisma client not generated
```

**Fix:**
```bash
# Ensure Prisma generates before build
# Add to package.json:
"postinstall": "prisma generate"
```

### Database Connection Issues

**Error: Can't reach database**
```bash
# Test connection
npx prisma db push

# Check:
# - DATABASE_URL format
# - Database is accessible from deployment
# - SSL mode (add ?sslmode=require)
```

### Redis Connection Issues

**Error: Redis connection failed**
```bash
# Test connection
redis-cli -u $REDIS_URL PING

# Check:
# - REDIS_URL format
# - Redis is accessible
# - TLS enabled if required
```

### Email Not Sending

**Magic links not arriving:**
```bash
# Check SMTP credentials
# Verify sender domain
# Check spam folder
# Test with different email provider
```

### Cron Job Not Running

**Vercel cron not executing:**
1. Check `vercel.json` syntax
2. Verify endpoint is accessible
3. Check Vercel dashboard logs
4. Ensure endpoint doesn't require auth (or use internal auth)

---

## 📈 Scaling Considerations

### Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Connection Pooling**: Use Prisma Data Proxy or PgBouncer
- **Indexing**: Ensure proper indexes on frequently queried fields

### Redis Scaling
- **Clustering**: For high availability
- **Eviction Policy**: Configure for your use case
- **Memory**: Monitor and adjust limits

### Application Scaling
- **Horizontal**: Vercel auto-scales serverless functions
- **Caching**: Aggressive Redis caching for catalog
- **CDN**: Use for static assets

### Worker Scaling
- **Multiple Workers**: Run multiple BullMQ workers
- **Concurrency**: Adjust worker concurrency settings
- **Queue Priority**: Implement priority queues

---

## ✅ Deployment Verification Checklist

### Functionality
- [ ] Homepage loads
- [ ] Sign-in works (magic link)
- [ ] Products display (from cache)
- [ ] Cart operations work
- [ ] Order placement succeeds
- [ ] Admin panel accessible
- [ ] User profile works

### Performance
- [ ] Page load < 3s
- [ ] API responses < 500ms
- [ ] Product cache hit rate > 90%
- [ ] No memory leaks

### Security
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Rate limiting works
- [ ] Auth requires valid session
- [ ] Admin routes protected

### Monitoring
- [ ] Logs are being collected
- [ ] Error tracking configured
- [ ] Uptime monitoring active
- [ ] Performance metrics tracked

---

## 🎉 Success!

Your Elite Coffee Shop is now live in production!

**Next Steps:**
1. Monitor logs for errors
2. Track user signups
3. Monitor Odoo sync status
4. Optimize based on metrics
5. Plan feature rollout

**Support:**
- Documentation: `docs/` folder
- Health Check: `/api/health`
- Sync Status: `/api/sync/status`

---

**Deployed:** ✅  
**Monitored:** ✅  
**Secured:** ✅  
**Scaled:** ✅  

**Ready to serve customers!** ☕


