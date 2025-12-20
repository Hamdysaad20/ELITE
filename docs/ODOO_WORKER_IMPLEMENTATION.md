# Odoo Worker Implementation Guide

## Overview

This document explains how the Odoo order sync worker is implemented and how it handles different deployment environments.

## Architecture

The system uses a **multi-strategy approach** to ensure orders are synced to Odoo reliably across different deployment scenarios:

1. **Redis Queue + Worker** (Preferred - Production)
2. **Inline Sync Fallback** (Backup - Serverless/Development)

## Deployment Strategies

### 1. Traditional Hosting (VPS, Docker, Railway, etc.)

**How it works:**
- Worker auto-starts when the application initializes
- Each instance can run its own worker
- Uses Redis queue for job distribution
- Graceful shutdown on process termination

**Configuration:**
```bash
REDIS_URL=redis://your-redis-url
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user
ODOO_API_KEY=your_key
```

**Startup:**
- Worker starts automatically on app initialization
- No manual action required

### 2. Serverless (Vercel, Netlify, AWS Lambda)

**How it works:**
- **Order sync runs inline** during `POST /api/orders` (serverless-safe).
- A worker may still attempt to auto-start (if enabled) but **orders do not rely on it**.
- If you deploy a separate worker service, you can use the queue-based path in non-serverless deployments.

**Configuration:**
```bash
REDIS_URL=redis://your-redis-url  # Optional (used by queue/locking; may be used by other parts of the system)
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user
ODOO_API_KEY=your_key

# Recommended on Vercel if you rely on inline order sync:
ENABLE_ODOO_WORKER=false
```

**Options:**

**Option A: Inline sync (Recommended for Vercel orders)**
- Orders sync inline on creation
- No dependency on long-running workers

**Option B: Separate worker process (Most Reliable for async retries)**
- Deploy worker as a separate service (e.g., Railway, Render, Fly.io)
- Run: `npm run worker:odoo`
- Worker processes jobs from Redis queue
- API routes just enqueue jobs

**Option C: Auto-start worker on serverless (Not recommended for Vercel)**
- Even with distributed locking, serverless instances are not guaranteed to run continuously
- Prefer Option A (inline) or Option B (separate worker)

### 3. Edge Runtime

**How it works:**
- Worker cannot run in Edge runtime (no Node.js APIs)
- Always uses inline sync fallback
- Sync happens in the same function execution

**Configuration:**
- No special configuration needed
- Inline sync handles everything

## Implementation Details

### Distributed Locking (Serverless)

To prevent multiple instances from running duplicate workers:

1. **Lock Acquisition**: Uses Redis `SETNX` with expiration
2. **Lock Renewal**: Worker renews lock every 30 seconds
3. **Lock Loss Detection**: If lock is lost, worker shuts down gracefully
4. **Lock Release**: On shutdown, lock is released

**Lock Key**: `odoo:worker:lock`
**Lock TTL**: 60 seconds (renewed every 30 seconds)

### Error Handling

- **Queue failures**: Falls back to inline sync
- **Worker failures**: Jobs are retried (3 attempts with exponential backoff)
- **Sync failures**: Order status updated to "failed"
- **Lock failures**: Worker does not start in serverless (prevents duplicate workers)

### Resource Cleanup

- **Graceful shutdown**: Handles SIGTERM, SIGINT
- **Uncaught exceptions**: Worker shuts down, process exits
- **Unhandled rejections**: Logged but don't crash worker
- **Lock cleanup**: Lock released on shutdown

## Monitoring

### Logs to Watch

**Successful sync:**
```
[odooSync] Order <id> queued for sync
[odoo-worker] Job <id> completed
[odooSync] Order <id> sync completed successfully
```

**Worker startup:**
```
[odoo-worker] Auto-started successfully
[odoo-worker] Auto-started successfully (with distributed lock)  # Serverless
```

**Fallback sync:**
```
[odooSync] Queue unavailable, running sync inline for order <id>
```

**Errors:**
```
[odoo-worker] Job <id> failed: <error>
[odooSync] Order sync failed for <id>: <error>
```

### Health Checks

Check worker status:
```bash
# Check if worker is running
npm run investigate

# Check Redis queue status (if using Redis)
# Connect to Redis and check: odoo:worker:lock
```

## Troubleshooting

### Worker Not Starting

1. **Check Redis connection**: `REDIS_URL` must be set
2. **Check logs**: Look for `[odoo-worker]` messages
3. **Serverless**: Check if distributed lock is held by another instance
4. **Edge runtime**: Worker cannot run in Edge runtime

### Duplicate Workers

1. **Serverless**: Ensure distributed locking is working
2. **Traditional**: Multiple workers are OK (they share the queue)

### Orders Not Syncing

1. **Check Odoo configuration**: All `ODOO_*` env vars must be set
2. **Check worker status**: Is worker running?
3. **Check queue**: Are jobs being queued?
4. **Check fallback**: Are inline syncs running?

### High Memory Usage

1. **Worker concurrency**: Default is 5, reduce if needed
2. **Job cleanup**: Completed jobs are cleaned up automatically
3. **Lock renewal**: Happens every 30 seconds

## Best Practices

1. **Production**: Use separate worker process for reliability
2. **Development**: Auto-start is fine
3. **Serverless**: Use distributed locking or separate worker
4. **Monitoring**: Set up alerts for failed syncs
5. **Retries**: Jobs retry automatically (3 attempts)
6. **Cleanup**: Old jobs are cleaned up automatically

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | Yes (for queue) | Redis connection URL |
| `ODOO_HOST` | Yes | Odoo instance URL |
| `ODOO_DB` | Yes | Odoo database name |
| `ODOO_USERNAME` | Yes | Odoo username |
| `ODOO_API_KEY` | Yes* | Odoo API key (preferred) |
| `ODOO_PASSWORD` | Yes* | Odoo password (fallback) |
| `ENABLE_ODOO_WORKER` | No | Force worker start in serverless |

*Either `ODOO_API_KEY` or `ODOO_PASSWORD` is required

## Migration Guide

### From Manual Worker to Auto-Start

1. Ensure `REDIS_URL` is set
2. Remove manual worker process
3. Worker will auto-start on app initialization
4. Monitor logs to confirm worker started

### From Inline Sync to Queue

1. Set `REDIS_URL`
2. Worker will automatically start using queue
3. Existing inline syncs continue to work as fallback

### From Single Instance to Multiple Instances

1. Ensure `REDIS_URL` is set (for shared queue)
2. In serverless: Distributed locking handles it automatically
3. In traditional: Multiple workers share the same queue (OK)

