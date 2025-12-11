# AI Workspace

> Temporary workspace for AI assistants to generate iteration documents

## Purpose

This folder is a **temporary workspace** for AI assistants to:
- Create iteration plans
- Generate implementation notes
- Draft technical documentation
- Store analysis results
- Track work-in-progress

## Usage Guidelines

### ✅ Do Use This For:
- Iteration planning documents
- Technical analysis drafts
- Implementation checklists
- Work-in-progress documentation
- Temporary notes and findings
- Code generation plans

### ❌ Don't Use This For:
- Final/published documentation (move to `/docs`)
- Production code
- Configuration files
- Long-term storage

## File Lifecycle

```
1. Create → Draft iteration/analysis document here
2. Work → AI iterates on document as work progresses
3. Complete → Move final version to appropriate location:
   - Documentation → /docs
   - Code → /src
   - Scripts → /scripts
4. Clean → Delete or archive temporary files
```

## File Naming Convention

Use descriptive, dated filenames:
```
YYYY-MM-DD-feature-name-iteration.md
YYYY-MM-DD-analysis-topic.md
YYYY-MM-DD-implementation-plan.md
```

Examples:
- `2025-12-11-odoo-sync-analysis.md`
- `2025-12-11-ui-improvements-plan.md`
- `2025-12-11-api-refactor-notes.md`

## Cleanup Policy

Files in this directory should be:
- **Reviewed weekly** - Move completed work to proper locations
- **Archived monthly** - Delete or archive outdated iterations
- **Kept lean** - Don't let temporary files accumulate

## Example Workflow

### Step 1: Create Iteration Plan
```markdown
# 2025-12-11-feature-x-implementation.md

## Goal
Implement feature X with Y functionality

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
- Implementation note 1
- Implementation note 2
```

### Step 2: Work & Update
AI updates the file as work progresses, checking off tasks.

### Step 3: Finalize
Once complete, extract:
- Key decisions → `/docs/ARCHITECTURE.md`
- Implementation guide → `/docs/FEATURE_X.md`
- Delete iteration file

---

## Current Files

*(List auto-generated - AI should update as files are created)*

```bash
# View current files
ls -lh .ai-workspace/
```

---

## Template Files

### Iteration Template
```markdown
# YYYY-MM-DD-[feature-name]-iteration.md

## Objective
[Clear objective statement]

## Context
[Background and requirements]

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Implementation Notes
[Technical notes as work progresses]

## Decisions Made
[Key architectural/technical decisions]

## Next Steps
[What needs to happen next]

## Outcome
[Final result/status]
```

### Analysis Template
```markdown
# YYYY-MM-DD-[topic]-analysis.md

## Problem Statement
[What needs analysis]

## Current State
[How things work now]

## Issues Identified
1. Issue 1
2. Issue 2

## Proposed Solutions
### Option 1
- Pros: ...
- Cons: ...

### Option 2
- Pros: ...
- Cons: ...

## Recommendation
[Chosen approach and reasoning]

## Implementation Plan
[High-level plan]
```

---

## Integration with Main Docs

When finalizing work:

1. **Extract key information** from iteration files
2. **Update relevant `/docs` files**:
   - System overview
   - Feature documentation
   - API reference
   - Troubleshooting
3. **Delete iteration file** or move to archive
4. **Update CHANGELOG** if applicable

---

*This is a working directory - expect frequent changes!*
