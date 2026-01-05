---
description: Guidelines for creating and interacting with Pull Requests
---

# PR Creation & Management Workflow

## 1. The "Single Responsibility" Rule
A Pull Request (PR) should do **one thing well**.
- **Bad PR**: "Fix login bug and add dark mode and faster database queries"
- **Good PR**: "Fix login race condition in AuthProvider"

## 2. Dealing with Dependencies (Stacked PRs)
If Feature B depends on Feature A, do not mix them.

**Workflow:**
1.  **Branch A**: Implement Feature A (e.g., "Add `discount_price` to Product Schema").
2.  **Submit PR A**: Focus only on the DB migration and schema update.
3.  **Branch B**: Checkout from Branch A. Implement Feature B (e.g., "Display discount price on Product Page").
4.  **Submit PR B**: Mentions "Depends on PR A".

*Why?* Because small PRs get reviewed faster and carry less risk.

## 3. The "Production Ready" Checklist
Before you say "I have created the PR", you must verify:
- [ ] **No Dead Code**: Did you remove the old function you replaced?
- [ ] **No Console Logs**: Is the console clean?
- [ ] **Formatting**: Did you run `npm run format`?
- [ ] **Typing**: Are there any `any` types? (There shouldn't be).
- [ ] **Self-Description**: Does the PR description explain *how* to test the changes?

## 4. Addressing Feedback
If a Reviewer (User or another Agent) requests changes:
1.  Do not argue unless the reviewer is factually incorrect.
2.  Make the change in a **new commit** (do not force push immediately if history validation is needed, but typically squash is fine).
3.  Reply "Done" only after the code is actually pushed.
