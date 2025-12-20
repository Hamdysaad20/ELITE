# Vercel Deployment Guide

## Build Status

✅ **Build successful** - All Vercel production issues resolved

## Changes Made for Vercel Compatibility

### 1. Build-Time Worker Prevention
- Worker no longer starts during Next.js build process
- Detects `NEXT_PHASE` environment variable
- Prevents unnecessary resource usage during build

### 2. Serverless Environment Detection
- Automatically detects Vercel environment (`VERCEL === "1"`)
- Uses distributed locking to prevent duplicate workers
- Falls back to inline sync if worker can't start

### 3. Redis Connection Optimization
- Optimized for serverless (no persistent connections)
- Proper connection cleanup
- Handles connection failures gracefully

### 4. Edge Runtime Compatibility
- Worker skips initialization in Edge runtime
- Automatic fallback to inline sync

## Vercel Configuration

### Environment Variables

Required for production:

```bash
# Database
DATABASE_URL=postgresql://...

# Redis (for queue and distributed locking)
REDIS_URL=redis://...

# Odoo
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user
ODOO_API_KEY=your_key

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app

# Email (if using)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_user
EMAIL_SERVER_PASSWORD=your_password
EMAIL_FROM=noreply@yourdomain.com
```

### Optional Environment Variables

```bash
# Odoo worker auto-start (recommended OFF on Vercel for orders)
# Orders sync inline on Vercel, so the worker is not required and may just add log noise.
ENABLE_ODOO_WORKER=false

# Odoo timeout
# ODOO_TIMEOUT_MS=60000

# Odoo SSL (dev only)
ODOO_INSECURE_SSL=false
```

## Deployment Options

### Option 1: Inline order sync (Recommended for Vercel)

**How it works:**
- `POST /api/orders` syncs to Odoo **inline** (serverless-safe).
- No dependency on long-running workers.

**Setup:**
1. Set `ENABLE_ODOO_WORKER=false`
2. Deploy

**Pros:**
- Simple setup
- No separate service needed

**Cons:**
- Adds latency to `POST /api/orders` (bounded by `ODOO_TIMEOUT_MS`)
- No automatic retries if Odoo is down (order is created; Odoo sync can fail)

### Option 2: Separate Worker Process (Recommended for Production)

**How it works:**
- Deploy worker as separate service (Railway, Render, Fly.io)
- Worker processes jobs from Redis queue
- API routes just enqueue jobs

**Setup:**
1. Create new service/deployment
2. Run: `npm run worker:odoo`
3. Keep it running 24/7

**Pros:**
- Most reliable
- Independent scaling
- No impact on API performance
- Persistent worker process

**Cons:**
- Requires separate service
- Additional cost

### Option 3: Inline Sync Only (Simplest)

**How it works:**
- No worker, no Redis queue
- Orders sync inline when created
- Works but blocks API response slightly

**Setup:**
1. Set `ENABLE_ODOO_WORKER=false`
2. (Optional) Keep `REDIS_URL` if you use Redis for other features
3. Deploy - inline sync handles everything

**Pros:**
- Simplest setup
- No additional services
- Works immediately

**Cons:**
- Blocks API response
- No retry mechanism
- Not ideal for high traffic

## Vercel-Specific Features

### Cron Jobs

Already configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync/products",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This syncs products from Odoo daily at 2 AM.

### Function Configuration

All API routes use Node.js runtime (default).
No Edge runtime configuration needed.

### Build Configuration

Build command: `npm run build`
Output directory: `.next` (default)

## Monitoring

### Check Worker Status

1. **Vercel Logs:**
   - Go to Vercel dashboard → Your project → Logs
   - Look for `[odoo-worker]` messages

2. **Health Check:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Investigate Orders:**
   ```bash
   npm run investigate
   ```

### Expected Logs

**Worker Started:**
```
[odoo-worker] Auto-started successfully (with distributed lock)
```

**Order Synced:**
```
[odooSync] Order <id> queued for sync
[odoo-worker] Job <id> completed
[odooSync] Order <id> sync completed successfully
```

**Fallback Sync:**
```
[odooSync] Queue unavailable, running sync inline for order <id>
```

## Troubleshooting

### Worker Not Starting

1. **Check Environment Variables:**
   - `REDIS_URL` must be set
   - `ENABLE_ODOO_WORKER=true` if using auto-start

2. **Check Logs:**
   - Look for `[odoo-worker]` messages in Vercel logs
   - Check for error messages

3. **Distributed Lock:**
   - Another instance might be holding the lock
   - This is normal - only one worker runs

### Orders Not Syncing

1. **Check Odoo Configuration:**
   - All `ODOO_*` env vars must be set
   - Test connection: `curl https://your-app.vercel.app/api/odoo/test`

2. **Check Worker Status:**
   - Is worker running? Check logs
   - Are jobs being queued? Check Redis

3. **Check Fallback:**
   - If no Redis, inline sync should work
   - Check logs for `[odooSync]` messages

### Build Errors

1. **Prisma Issues:**
   - Ensure `DATABASE_URL` is set
   - Run `npx prisma generate` locally first

2. **Type Errors:**
   - Run `npm run lint` locally
   - Fix any TypeScript errors

3. **Missing Dependencies:**
   - Check `package.json`
   - Ensure all dependencies are listed

## Performance Optimization

### Function Timeout

Vercel default: 10 seconds (Hobby), 60 seconds (Pro)

For long-running syncs:
- Use queue + worker (recommended)
- Or increase timeout in Vercel settings

### Cold Starts

- First request after inactivity may be slower
- Worker auto-start adds ~1-2 seconds
- Subsequent requests are fast

### Memory Usage

- Default: 1024 MB (Hobby), 3008 MB (Pro)
- Worker uses minimal memory
- Monitor in Vercel dashboard

## Security

### Environment Variables

- Never commit `.env` files
- Use Vercel's environment variable settings
- Rotate secrets regularly

### API Keys

- Use Odoo API keys (not passwords)
- Rotate keys periodically
- Monitor for unauthorized access

### Redis

- Use Redis AUTH if available
- Use TLS/SSL connections
- Monitor connection logs

## Cost Optimization

### Hobby Plan

- 100 GB bandwidth/month
- 100 hours execution time/month
- Suitable for small to medium traffic

### Pro Plan

- Unlimited bandwidth
- 1000 hours execution time/month
- Better for production

### Recommendations

- Use separate worker service for high traffic
- Monitor function execution time
- Optimize sync operations

## Next Steps

1. ✅ Build successful
2. ✅ Vercel configuration ready
3. ⏭️ Set environment variables in Vercel
4. ⏭️ Deploy to Vercel
5. ⏭️ Monitor logs and health checks
6. ⏭️ Test order sync functionality

## Support

If you encounter issues:

1. Check Vercel logs
2. Run `npm run investigate` locally
3. Check environment variables
4. Review this documentation

