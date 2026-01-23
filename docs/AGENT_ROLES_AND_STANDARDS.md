# Agent Roles & Project Standards

This document serves as the **SINGLE SOURCE OF TRUTH** for all agents and developers contributing to ELITE.

## 🎭 Project Roles

When working on a task, you must explicitly understand the role you are playing.

### 1. The Product Owner (Planning Phase)
- **Goal:** Define *what* needs to be built and *why*.
- **Responsibilities:**
  - analyze requirements deeply.
  - Reject ambiguous requests.
  - Define success criteria.
  - Create a detailed **Implementation Plan** before a single line of code is written.

### 2. The Tech Lead (Architecture Phase)
- **Goal:** Define *how* it will be built.
- **Responsibilities:**
  - Ensure new features fit existing architecture.
  - Identify breaking changes early.
  - Enforce "Production Ready" standards.
  - **Plan for PRs:** If a feature is complex, break it down into multiple, dependent PRs (Stacked PRs).

### 3. The Backend/Frontend Developer (Execution Phase)
- **Goal:** Build it right, the first time.
- **Responsibilities:**
  - Write clean, type-safe, self-documenting code.
  - **ZERO TODOs**: "I'll fix this later" is not acceptable. Fix it now.
  - **ZERO PLACEHOLDERS**: Do not write `// code goes here`. Write the code.
  - **Full Error Handling**: Every async operation must have `try/catch` and user-facing error reporting.

---

## 🚫 The "Production Ready" Standard

We do NOT ship "demo" code. We do NOT ship "prototypes". Every commit must be deployable to production.

### ✅ DO:
- **Handle Edge Cases:** What if the network fails? What if the API returns 500? What if the list is empty?
- **Validate Inputs:** Never trust user input. Use Zod schema validation everywhere.
- **Fail Gracefully:** If a component fails, the rest of the app should remain usable. Show a toast/alert to the user.
- **Test Your Code:** If you write a function, you must be confident it works.

### ❌ DO NOT:
- **Leave TODO comments:** If you can't do it now, document why in the issue/PR, not the code.
- **Use `console.log` for debugging:** Use a proper logger or remove logs before analyzing.
- **Hardcode Secrets:** Use environment variables.
- **Skip Types:** Do not use `any`. Define interfaces.

---

## 🔄 The Workflow: "One Goal, One PR"

1.  **Focus:** Each task/PR must have **ONE** clear goal.
2.  **Isolation:** Do not refactor unrelated code in a feature PR.
3.  **Dependencies:**
    *   *Scenario:* You need to update the Database Schema to add a new Feature.
    *   *Wrong Way:* One giant PR with DB changes + API + Frontend.
    *   *Right Way:*
        2.  PR #2: Backend API Endpoints & Types. (Review & Merge)
        3.  PR #3: Frontend UI Implementation. (Review & Merge)

## 🛠️ Specialized Workflows

### 🐛 Bug Fixing
- **Rule:** Reproduction First.
- **Workflow:** [Bug Fixing Workflow](../.agent/workflows/bug-fixing.md)

### 🧪 Testing
- **Rule:** Lint + Build + Test = Pass.
- **Workflow:** [Testing Protocol](../.agent/workflows/testing-protocol.md)

### 📚 Documentation
- **Rule:** Code Change = Doc Change.
- **Workflow:** [Docs Maintenance](../.agent/workflows/documentation-maintenance.md)

## 📝 Review Checklist (Agent Self-Correction)

Before declaring a task "Complete", an agent must ask:
1.  [ ] Did I leave any `TODO` or `FIXME` comments? -> *If yes, fix them.*
2.  [ ] Is there any dead code or commented-out blocks? -> *If yes, delete them.*
3.  [ ] Did I create a new file? -> *Does it follow the project structure?*
4.  [ ] Does the code handle errors? -> *Add try/catch.*
5.  [ ] Is this ready for a real user to pay money on? -> *If no, it's not done.*
