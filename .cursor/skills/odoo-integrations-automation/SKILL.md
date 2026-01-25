---
name: odoo-integrations-automation
description: Guides building Odoo 18 automations and external integrations using best practices and official Odoo documentation. Use when the user mentions Odoo, ERP integrations, Odoo automation, server actions, scheduled actions (cron), XML-RPC/JSON-RPC, REST APIs, webhooks, SSO, accounting sync, e-commerce sync, CRM sync, logistics/shipping integrations, or custom Odoo modules.
---

# Odoo Integrations & Automations (Odoo 18)

## Scope

Use this skill to design, implement, and troubleshoot:
- **Automations inside Odoo**: server actions, scheduled actions (cron), automated workflows, emails/activities, approval flows.
- **Integrations with external systems**: Odoo APIs (JSON-RPC / XML-RPC), inbound/outbound webhooks, iPaaS workflows, and custom services.
- **Custom development**: new Odoo modules, ORM model changes, security, performance, deployment/upgrade considerations.

Assume **Odoo 18** by default. The environment may be **mixed** (Odoo Online, Odoo.sh, on‑prem). Always branch guidance based on hosting constraints.

## Non-negotiables

1. **Investigate first**: read the repo’s existing Odoo integration code and docs before proposing changes.
2. **No demo/placeholder implementations**: use real patterns, types, and conventions from the codebase.
3. **Verify with official Odoo docs**:
   - If anything depends on version/edition/module, do a quick web lookup and cite the relevant Odoo doc pages.
   - Prefer official docs first, then reputable Odoo community sources if needed.
4. **Security and correctness first**: treat integration points as production-grade (auth, least privilege, idempotency, retries, audit logs).

## Quick decision tree

### 1) Where should the automation live?

- **Inside Odoo** (best when data + workflow are Odoo-native):
  - Server actions / automated actions
  - Scheduled actions (cron)
  - Mail/activity automations
- **Outside Odoo** (best when integrating multiple systems or needing scale/observability):
  - A dedicated integration service (queue + retries)
  - iPaaS (Zapier/Make) only for low-risk, low-volume flows

### 2) Hosting constraints (must ask/confirm)

- **Odoo Online (SaaS)**: limited code-level customization; prefer Odoo features + supported connectors.
- **Odoo.sh**: supports custom modules; CI/buildpack constraints; manage secrets carefully.
- **On-prem**: full control; must manage upgrades, workers, queues, reverse proxy, and security hardening.

### 3) Integration style

- **Outbound from Odoo**:
  - webhooks (if available) or cron + polling
  - message queue patterns (if you control infra)
- **Inbound to Odoo**:
  - call Odoo APIs (JSON-RPC/XML-RPC) from external service
  - avoid direct DB writes; use ORM via RPC

## Implementation workflow (use this every time)

### Step 0 — Gather requirements (ask these questions)

- **Business goal**: what user action or business event triggers it?
- **Source of truth**: which system owns each field?
- **Data model**: which Odoo model(s) and fields are involved (e.g., partners, products, orders, invoices, pickings)?
- **Volume/latency**: expected throughput and acceptable delay.
- **Failure semantics**:
  - must it be **exactly-once**, **at-least-once**, or **best-effort**?
  - what’s the rollback / compensation strategy?
- **Hosting**: Online vs Odoo.sh vs on‑prem, and any compliance constraints.

### Step 1 — Trace existing code and conventions in this repo

Before designing anything new:
- Locate existing Odoo client/service code, job/queue logic, retry/backoff, and error taxonomy.
- Confirm how secrets are configured (env vars, vault), and how logs/audits are recorded.

### Step 2 — Choose a minimal, robust architecture

Default best practice for production integrations:
- **Idempotent writes** (dedupe keys, external IDs, unique constraints where applicable)
- **Queued processing** with retries and DLQ-like behavior (or “failed jobs” table)
- **Observability**: structured logs + correlation IDs + metrics
- **Backpressure**: rate limits and concurrency controls

### Step 3 — Odoo module best practices (when writing custom code)

- **Models**: use ORM cleanly; keep methods small; avoid side effects in computed fields.
- **Transactions**: understand commit boundaries; don’t rely on implicit commits.
- **Security**:
  - define **ACLs** and **record rules**
  - use `sudo()` only when justified and documented
  - never expose sensitive fields in controllers
- **Performance**:
  - batch reads/writes; minimize chatter
  - prefetch intelligently; avoid N+1 patterns
  - avoid heavy work in request/compute; offload to cron/queue when possible
- **Upgrades**:
  - prefer stable extension points (inherit models/views)
  - avoid monkey-patching core unless unavoidable

### Step 4 — Integration API best practices (when calling Odoo)

- Prefer **JSON-RPC** (typical for Odoo web) or **XML-RPC** (common for external integrations) based on existing codebase patterns.
- Always implement:
  - **timeouts**
  - **retry with jitter** (bounded)
  - **idempotency keys** (or external IDs mapped to Odoo records)
  - **rate limiting** / concurrency caps
  - **schema validation** on inbound payloads

### Step 5 — Testing & rollout

- Add tests appropriate to the layer:
  - module tests (Odoo test framework) for Odoo-side logic
  - unit/integration tests for external service (mock RPC, record/replay)
- Rollout plan:
  - migration/initial sync strategy
  - backfill and reconciliation scripts
  - feature flags / staged enablement

## Output format (always produce this)

When responding, format your result as:

```markdown
## Summary
- Goal:
- Proposed approach (inside Odoo / outside Odoo / hybrid):

## Current codebase findings
- Existing entry points:
- Existing conventions (client, retries, logging, queue):

## Design
- Trigger:
- Data mapping (source → Odoo model/fields):
- Idempotency strategy:
- Failure/retry strategy:
- Security considerations:

## Implementation steps
1.
2.
3.

## Test plan
- Unit:
- Integration:
- Rollout:

## References (official docs)
- [Title](link)
```

## Official docs lookup (how to verify “latest”)

When details may vary (edition/module/version), do a web lookup and cite the exact pages used:
- Odoo Developer Documentation (ORM, security, controllers, testing)
- Odoo External API docs (JSON-RPC / XML-RPC usage patterns)
- Odoo.sh documentation (deployment constraints)

Do not rely on memory for version-specific behavior—verify first.

