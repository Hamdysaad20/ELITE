---
description: Standard workflow for implementing a new feature
---

# Feature Implementation Workflow

Use this workflow when asked to "add a feature" or "build X".

## Phase 1: Planning & Analysis
1.  **Read Context**: Scan `docs/SYSTEM_OVERVIEW.md` and `docs/ARCHITECTURE_V1.md` to understand where the feature fits.
2.  **Check Standards**: Review `docs/AGENT_ROLES_AND_STANDARDS.md` to remind yourself of the "Production Ready" requirement.
3.  **Create Plan**:
    - Identify necessary database changes.
    - Identify necessary API endpoints.
    - Identify necessary UI components.
    - **Crucial**: Determine if this needs to be split into multiple PRs.

## Phase 2: Implementation (Iterative)

### Step 1: Backend / Core Logic
- Implementing the core logic first allows for easier testing.
- **Rule**: strict typing and error handling are mandatory.
- **Action**: Create/Update DB models (if needed) and run migrations.
- **Action**: Create Service/API layer with Zod validation.

### Step 2: Frontend / UI
- **Rule**: Use the existing Design System (Tailwind + Components). Do not invent new styles unless absolutely necessary.
- **Action**: Create components.
- **Action**: Integrate with API.
- **Action**: Add loading states (Skeleton loaders) and Error states (Toast notifications).

## Phase 3: Verification & Cleanup
1.  **Self-Audit**: Run a `grep` for "TODO", "FIXME", "console.log". Remove them.
2.  **Build Check**: Run `npm run build` (or relevant build command) to ensure no type errors.
3.  **Lint Check**: Run `npm run lint`.
4.  **Manual Test Simulation**: describe strictly how a user would test this.

## Phase 4: Delivery
- Create a PR description that links to the original issue/request.
- List exactly what was changed.
- Post screenshots if UI was changed.
