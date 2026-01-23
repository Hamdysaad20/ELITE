---
description: Protocol for verifying changes before submission
---

# Testing & Verification Protocol

## Mandatory Checks
Before submitting ANY Pull Request (or finishing a task), you must run these commands. If any fail, you are **NOT DONE**.

### 1. Static Analysis
```bash
npm run lint
npm run format
```

### 2. Build Verification
```bash
npm run build
```
*Why?* TypeScript errors often only show up during a full build, even if the IDE seems quiet.

### 3. Unit/Integration Tests
```bash
npm run test  # If available
```

### 4. System Verification
Run the custom verification script (if applicable to your changes):
```bash
./verify-system.sh
```

## Adding New Tests
-   If you built a new feature, you *must* add a test.
-   If you fixed a bug, you *must* add a regression test.

## Manual Testing
-   Automated tests catch regressions.
-   **Manual testing catches bad UX.**
-   Always verify the "Happy Path" manually in your mental model or simulation.
