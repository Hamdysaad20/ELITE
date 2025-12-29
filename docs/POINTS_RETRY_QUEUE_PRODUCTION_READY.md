# Points Retry Queue - Production Ready

## Overview
The Points Retry Queue system is now **production-ready** and **automatically starts** when the application initializes. It ensures eventual consistency between loyalty and analytics systems by automatically retrying failed points operations.

## Auto-Start Configuration

### How It Works

The worker automatically starts when:
1. **Application Initializes**: Imported in `src/app/api/orders/route.ts` to trigger on first API call
2. **Non-Serverless Environments**: Starts immediately with proper lifecycle management
3. **Serverless Environments (Vercel/Netlify)**: Uses distributed locking to ensure only ONE worker runs across all instances

### Environment Detection

The system automatically detects:
- **Serverless**: Vercel, Netlify, AWS Lambda, Fly.io, Railway
- **Build Time**: Skips worker during Next.js build
- **Edge Runtime**: Skips worker (no Node.js APIs)
- **Traditional Hosting**: Starts worker normally

### Distributed Locking (Serverless)

In serverless environments:
- Uses Redis-based distributed locking (`points-retry:worker:lock`)
- Only ONE instance runs the worker across all serverless instances
- Lock renews every 30 seconds
- Lock expires after 60 seconds if not renewed
- If lock is lost, worker shuts down gracefully

## Configuration

### Environment Variables

**Required**:
- `REDIS_URL`: Redis connection string for queue

**Optional**:
- `ENABLE_POINTS_RETRY_WORKER=false`: Disable auto-start (default: enabled)

### Manual Control

**Disable Auto-Start**:
```bash
ENABLE_POINTS_RETRY_WORKER=false npm start
```

**Manual Start** (for standalone worker):
```bash
npm run worker:points-retry
```

## Production Deployment

### Vercel/Netlify (Serverless)

✅ **Automatic**: Worker auto-starts with distributed locking
- No additional configuration needed
- Only one instance runs the worker
- Handles scaling automatically

### Traditional Hosting (Docker, VPS, etc.)

✅ **Automatic**: Worker auto-starts on application start
- Runs alongside the main application
- Handles graceful shutdown on SIGTERM/SIGINT

### Kubernetes/Container Orchestration

✅ **Automatic**: Worker auto-starts in each pod
- Each pod can run its own worker (no distributed locking needed)
- Handles pod lifecycle automatically

## Monitoring

### Logs

Structured JSON logs are emitted for:
- Worker start/stop
- Job completion
- Job failures
- Lock acquisition/release
- Errors

**Log Format**:
```json
{
  "timestamp": "2024-12-24T10:30:00.000Z",
  "event": "gamification.points.retry",
  "severity": "info|warn|error",
  "context": {
    "userId": "user-123",
    "points": 10,
    "system": "loyalty|analytics",
    "retryCount": 0,
    "success": true
  }
}
```

### Health Checks

Monitor worker health via:
- Application logs
- Redis queue metrics
- BullMQ dashboard (if configured)

## Graceful Shutdown

The worker handles:
- **SIGTERM**: Graceful shutdown (waits for current jobs)
- **SIGINT**: Graceful shutdown (Ctrl+C)
- **Uncaught Exceptions**: Logs and shuts down
- **Lock Loss**: Shuts down if distributed lock is lost

## Retry Strategy

- **Max Attempts**: 5 retries
- **Backoff**: Exponential (2s → 4s → 8s → 16s → 32s)
- **Idempotency**: Checks existing transactions before retrying
- **Permanent Errors**: Stops retrying on permanent errors (invalid user, etc.)

## Fallback Behavior

If Redis/queue is unavailable:
- **Serverless**: Runs inline retry (synchronous)
- **Traditional**: Falls back to inline retry
- **No Data Loss**: Operations are still attempted

## Files

**Auto-Start**:
- `src/server/services/startPointsRetryWorkerOnInit.ts` - Auto-start logic
- `src/app/api/orders/route.ts` - Import to trigger initialization

**Core**:
- `src/server/queue/pointsQueue.ts` - Queue infrastructure
- `src/server/services/gamification/pointsRetry.ts` - Retry processing
- `src/server/services/gamification/pointsIntegration.ts` - Queue integration

**Scripts**:
- `scripts/run-points-retry-worker.ts` - Standalone worker script
- `package.json` - `worker:points-retry` npm script

## Testing

### Local Development

1. **Start Redis**: `docker run -p 6379:6379 redis`
2. **Set REDIS_URL**: `export REDIS_URL=redis://localhost:6379`
3. **Start App**: `npm run dev`
4. **Worker Auto-Starts**: Check logs for `[points-retry-worker] Auto-started successfully`

### Production Verification

1. **Check Logs**: Look for worker start message
2. **Test Partial Success**: Create a scenario where one system fails
3. **Verify Queue**: Check Redis for queued jobs
4. **Monitor Retries**: Watch logs for retry attempts

## Troubleshooting

### Worker Not Starting

1. **Check REDIS_URL**: Must be set
2. **Check Logs**: Look for error messages
3. **Check Environment**: Verify not in build time or Edge runtime
4. **Check Lock**: In serverless, verify only one instance has lock

### Jobs Not Processing

1. **Check Worker Status**: Verify worker is running
2. **Check Redis Connection**: Verify REDIS_URL is correct
3. **Check Queue**: Use BullMQ dashboard or Redis CLI
4. **Check Logs**: Look for job processing errors

### Duplicate Workers (Serverless)

1. **Check Distributed Lock**: Only one instance should have lock
2. **Check Lock Renewal**: Lock should renew every 30 seconds
3. **Check Logs**: Look for "Another instance is running" messages

## Status

✅ **Production Ready**
- Auto-starts on application initialization
- Handles serverless and traditional hosting
- Distributed locking for serverless environments
- Graceful shutdown
- Comprehensive error handling
- Structured logging
- Idempotency protection

The system is ready for production deployment and will automatically handle points retry operations without manual intervention.

