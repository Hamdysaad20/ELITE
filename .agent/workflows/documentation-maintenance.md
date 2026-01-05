---
description: Guidelines for maintaining documentation synchronicity
---

# Documentation Maintenance Workflow

## Philosophy: "Code Change = Doc Change"
Documentation is not an afterthought. It is part of the feature.

## When to Update Docs?
Ask yourself these questions upon every code change:

1.  **Did I change the Database Schema?**
    -   *Action:* Update `docs/DB_SCHEMA_AND_CACHE_V1.md` (or relevant schema doc).
    -   *Action:* Update `PRISMA_SCHEMA_V1.md`.

2.  **Did I change an API Endpoint?**
    -   *Action:* Update `docs/API_CONTRACT_V1.md`.

3.  **Did I add a new Environment Variable?**
    -   *Action:* Update `docs/ENV_EXAMPLE.md`.
    -   *Action:* Update `docs/GETTING_STARTED.md` if setup steps changed.

4.  **Did I change a Core Architecture flow?**
    -   *Action:* Update `docs/ARCHITECTURE_V1.md`.

## The "Docs First" Approach for Features
When planning a new feature (Phase 1 of Feature Implementation), draft the documentation *before* writing the code. This clarifies your thought process.

## Reviewing Docs
-   Check `docs/README.md` to ensure your new doc is linked.
-   Check for "orphaned" docs (docs that are no longer true).
