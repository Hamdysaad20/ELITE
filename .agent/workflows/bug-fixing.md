---
description: Standard workflow for fixing bugs
---

# Bug Fixing Workflow

## The Golden Rule: "Micro-TDD" (Test Driven Debugging)
**NEVER** fix a bug without first creating a script that reproduces it.

## Step 1: Reproduction
Before touching the application code:
1.  Create a standalone script or test case that demonstrates the failure.
    -   *Example:* A script that calls the API endpoint with the bad payload.
    -   *Example:* A unit test that asserts the incorrect behavior.
2.  Run this script. **It MUST fail.**
3.  *Output:* `reproduction_script.ts` (or similar).

## Step 2: Root Cause Analysis
1.  Analyze *why* it failed.
2.  Trace the code execution.
3.  Add logging *temporarily* if needed (but remove before committing).

## Step 3: Implementation
1.  Apply the fix.
2.  Run the reproduction script again.
3.  **It MUST pass.**

## Step 4: Verification & Regression
1.  Run existing tests to ensure no regressions.
2.  Commit the reproduction case as a permanent test (if applicable) to prevent future regression.

## Step 5: PR Creation
1.  Follow the [PR Creation Workflow](./pr-creation.md).
2.  In the description, include: "Reproduction: [link to test]"
