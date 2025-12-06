# Architecture v1 (Web + Mobile Ready)

## Scope
- One backend service (Express/Fastify/Nest) serving web + mobile.
- Redis for catalog cache and short-lived POS availability.
- Postgres for users, orders, loyalty, and sync runs.
- Odoo as downstream system for catalog source and sales/POS sync.
- Queue/cron for async Odoo sync (products and orders).

## High-Level Diagram
```
Users (Web/ Mobile)
        |
        v
  Backend API (REST)
        |
  +-----+------------------------+
  |              |               |
  v              v               v
Redis (catalog)  Postgres (core) Queue/Jobs
        |              |               |
        +--------------+---------------+
                       |
                       v
                    Odoo (JSON-RPC)
```

## Key Responsibilities
- Backend API: auth, products, categories, orders, POS availability, sync trigger.
- Redis: serve cached products/categories; short TTL cache for POS availability.
- Postgres: source of truth for users, orders, loyalty, sync runs.
- Queue/cron: background product sync and order-to-Odoo sync.
- Odoo: catalog source; downstream sales/POS system.

## Service Boundaries
- Frontend calls only Backend API. No direct Odoo calls from clients.
- Backend talks to Redis/Postgres locally and to Odoo via JSON-RPC client.
- Background jobs share the same codebase and libraries (odooClient, Redis, DB).

## Configuration (env)
- Odoo: ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY|PASSWORD, ODOO_TIMEOUT_MS, ODOO_INSECURE_SSL (dev only).
- Redis: REDIS_URL (Upstash/Cloud).
- Postgres: DATABASE_URL.
- Auth: AUTH_SECRET (JWT/session), ADMIN_TOKEN for /sync/products initially.

## Observability
- /health: checks DB + Redis + basic process health.
- /metrics: counts for Odoo latency/errors, sync duration, queue depth.
- Logs: structured, include request id and order id when present.

