# Services & Free Tier Analysis

## Required Services

### 1. ✅ Redis (Upstash - Recommended)

**Purpose**:
- BullMQ queues (Odoo sync + Points retry)
- Product catalog caching
- Distributed locking for workers
- Rate limiting storage

**Provider**: Upstash (Serverless Redis)

**Free Tier Limits**:
- **10,000 commands/day**
- **256 MB storage**
- **30 connections**
- **No expiration on free tier**

**Estimated Usage**:

**Queue Operations** (BullMQ):
- Odoo queue: ~10-50 jobs/day (order syncs)
- Points retry queue: ~5-20 jobs/day (failed points operations)
- **Total queue operations**: ~50-200 commands/day
- **Queue storage**: ~1-5 MB (job data)

**Caching Operations**:
- Product catalog: ~100-500 products cached
- Cache reads: ~1,000-5,000/day (page views)
- Cache writes: ~10-50/day (product syncs)
- **Total cache operations**: ~1,000-5,000 commands/day
- **Cache storage**: ~10-50 MB (product data)

**Distributed Locking**:
- Lock acquisition: ~2/day (worker starts)
- Lock renewal: ~60/day (every 30 seconds × 2 workers)
- **Total lock operations**: ~100 commands/day

**Rate Limiting**:
- Auth rate limits: ~50-200/day
- **Total rate limit operations**: ~100-300 commands/day

**Total Estimated Usage**:
- **Commands**: ~1,500-5,600 commands/day
- **Storage**: ~15-60 MB
- **Connections**: 2-5 (workers + API)

**Free Tier Status**: ✅ **WELL WITHIN LIMITS**
- Commands: ~1,500-5,600/day << 10,000/day limit
- Storage: ~15-60 MB << 256 MB limit
- Connections: 2-5 << 30 limit

---

### 2. ✅ PostgreSQL Database

**Purpose**:
- User accounts
- Orders
- Loyalty points
- Gamification (achievements, badges, streaks)
- Products/categories (from Odoo sync)

**Provider**: Neon, Supabase, or Vercel Postgres

**Free Tier Limits** (Neon - Example):
- **0.5 GB storage**
- **Unlimited connections** (with connection pooling)
- **512 MB RAM**
- **No time limits**

**Estimated Usage**:

**Data Storage**:
- Users: ~1 KB/user × 1,000 users = ~1 MB
- Orders: ~5 KB/order × 10,000 orders = ~50 MB
- Order items: ~2 KB/item × 30,000 items = ~60 MB
- Loyalty ledger: ~1 KB/entry × 50,000 entries = ~50 MB
- Gamification tables: ~10-20 MB
- **Total estimated**: ~200-300 MB

**Free Tier Status**: ✅ **WELL WITHIN LIMITS**
- Storage: ~200-300 MB << 512 MB limit

---

### 3. ✅ Hosting (Vercel)

**Purpose**:
- Next.js application hosting
- API routes
- Serverless functions

**Free Tier Limits** (Vercel Hobby):
- **100 GB bandwidth/month**
- **100 serverless function executions/day** (unlimited on Pro)
- **Unlimited API routes**
- **Edge network included**

**Estimated Usage**:

**API Calls**:
- Product catalog: ~1,000-5,000/day
- Orders: ~50-200/day
- Auth: ~100-500/day
- **Total**: ~1,500-6,000 API calls/day

**Bandwidth**:
- Average response: ~50 KB
- Daily: ~75-300 MB
- Monthly: ~2-9 GB

**Free Tier Status**: ✅ **WELL WITHIN LIMITS**
- Bandwidth: ~2-9 GB/month << 100 GB/month limit
- Functions: Unlimited on Hobby plan (after 100/day)

---

## Service Summary

| Service | Provider | Free Tier Limit | Estimated Usage | Status |
|---------|----------|-----------------|-----------------|--------|
| **Redis** | Upstash | 10,000 commands/day, 256 MB | ~1,500-5,600/day, ~15-60 MB | ✅ **SAFE** |
| **PostgreSQL** | Neon/Supabase | 0.5 GB storage | ~200-300 MB | ✅ **SAFE** |
| **Hosting** | Vercel | 100 GB bandwidth/month | ~2-9 GB/month | ✅ **SAFE** |

---

## Cost Breakdown

### Free Tier Usage

**Redis (Upstash)**:
- Commands: ~2,000/day average = **60,000/month**
- Free tier: **300,000/month** (10,000/day × 30)
- **Usage**: ~20% of free tier ✅

**PostgreSQL (Neon)**:
- Storage: ~250 MB average
- Free tier: **512 MB**
- **Usage**: ~50% of free tier ✅

**Vercel**:
- Bandwidth: ~5 GB/month average
- Free tier: **100 GB/month**
- **Usage**: ~5% of free tier ✅

---

## When You'd Need to Upgrade

### Redis (Upstash)

**Upgrade needed if**:
- Commands exceed 10,000/day (currently ~2,000/day)
- Storage exceeds 256 MB (currently ~30 MB)
- Need more than 30 connections

**Upgrade cost**: ~$10/month (Pay-as-you-go)

**Scaling factors**:
- High traffic: 10,000+ page views/day
- Many failed points operations: 100+ retries/day
- Large product catalog: 1,000+ products

### PostgreSQL (Neon)

**Upgrade needed if**:
- Storage exceeds 512 MB (currently ~250 MB)
- Need more RAM for complex queries

**Upgrade cost**: ~$19/month (Launch plan)

**Scaling factors**:
- Large order history: 50,000+ orders
- Many users: 10,000+ users
- Complex analytics queries

### Vercel

**Upgrade needed if**:
- Bandwidth exceeds 100 GB/month (currently ~5 GB)
- Need more serverless function executions

**Upgrade cost**: ~$20/month (Pro plan)

**Scaling factors**:
- High traffic: 100,000+ page views/month
- Many API calls: 10,000+ API calls/day

---

## Optimization Recommendations

### To Stay in Free Tier Longer

1. **Redis Optimization**:
   - Set appropriate TTLs on cache keys (currently 7 days for products)
   - Clean up old queue jobs automatically
   - Use Redis pipelining for batch operations

2. **Database Optimization**:
   - Archive old orders (move to separate table)
   - Clean up old gamification data
   - Use connection pooling (already implemented)

3. **Caching Strategy**:
   - Cache product catalog aggressively (7 days TTL)
   - Use CDN for static assets
   - Implement cache warming for popular products

---

## Monitoring

### Key Metrics to Watch

1. **Redis**:
   - Daily command count
   - Storage usage
   - Connection count

2. **PostgreSQL**:
   - Database size
   - Connection pool usage
   - Query performance

3. **Vercel**:
   - Bandwidth usage
   - Function execution count
   - Response times

### Alert Thresholds

Set alerts when:
- Redis commands > 8,000/day (80% of free tier)
- PostgreSQL storage > 400 MB (80% of free tier)
- Vercel bandwidth > 80 GB/month (80% of free tier)

---

## Conclusion

✅ **ALL SERVICES FIT IN FREE TIER**

**Current Usage**:
- Redis: ~20% of free tier
- PostgreSQL: ~50% of free tier
- Vercel: ~5% of free tier

**Room to Grow**:
- Can handle **5x current traffic** before hitting limits
- Can scale to **~10,000 users** before needing upgrades
- Can process **~1,000 orders/day** before hitting limits

**Recommendation**: 
- ✅ Start with free tiers
- ✅ Monitor usage monthly
- ✅ Upgrade when you hit 80% of limits
- ✅ Optimize before upgrading (caching, archiving)

---

## Service Setup Checklist

- [ ] **Upstash Redis**: Create free account, get `REDIS_URL`
- [ ] **Neon PostgreSQL**: Create free database, get `DATABASE_URL`
- [ ] **Vercel**: Deploy Next.js app (free tier)
- [ ] **Monitor**: Set up usage alerts at 80% thresholds

---

## Alternative Providers (If Needed)

### Redis Alternatives
- **Redis Cloud**: Free tier (30 MB, 30 connections)
- **Upstash**: Current choice (best for serverless)
- **Self-hosted**: Free but requires infrastructure

### PostgreSQL Alternatives
- **Supabase**: Free tier (500 MB, unlimited connections)
- **Neon**: Current choice (best for serverless)
- **Vercel Postgres**: Integrated with Vercel

### Hosting Alternatives
- **Vercel**: Current choice (best for Next.js)
- **Netlify**: Similar free tier
- **Railway**: $5/month (includes database)

---

**Status**: ✅ **All services fit comfortably in free tiers**

