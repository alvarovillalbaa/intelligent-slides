# One-Off Documentation Reference

One-off docs are created once to capture a specific decision, investigation, or event. They are rarely updated after creation — their value comes from being a historical record.

---

## Technical Reports

### When to Write

Write a technical report for:
- Architecture audits (before/after a major refactor)
- Performance investigations (profiling results, query analysis, load test findings)
- Security audits or vulnerability assessments
- Dependency audits (what's outdated, what's risky)
- Third-party service evaluations (comparing Provider A vs Provider B)
- Post-refactor documentation (what changed, what was learned)

### Structure

```
docs/reports/YYYY-MM-DD/report-name.md
```

**Standard report structure:**

```markdown
# [Report Title]

**Date:** YYYY-MM-DD
**Author(s):** [Names or agent identifiers]
**Status:** Draft | In Review | Final
**Scope:** [What this report covers — be specific]

## Executive Summary

2–5 sentences. What was investigated, what was found, and what action is recommended.
Written last, after the full report is complete.

## Context

Why this report exists. What prompted the investigation.
Link to relevant issues, PRs, or incidents.

## Findings

Numbered findings, ordered by severity or importance.

### Finding 1: [Title]

**Severity:** Critical | High | Medium | Low | Informational
**Evidence:** [Data, measurements, code references]
**Impact:** [What does this mean for the system or team?]

[Detailed explanation with code snippets, query outputs, or diagrams as needed]

### Finding 2: ...

## Recommendations

Actionable recommendations, each mapped to a finding.

| Finding | Recommendation | Effort | Priority |
|---|---|---|---|
| Finding 1 | Migrate to connection pooling | Medium | High |
| Finding 2 | Add GinIndex on search_vector field | Low | High |

## Appendix

Raw data, full query outputs, benchmark configurations, or supplementary material
that would bloat the main body.
```

### Report Quality Standards

- Lead with the summary — busy engineers read that and skip the rest
- Evidence is non-negotiable — every finding needs a measurement or code reference
- Distinguish fact from opinion — label interpretations clearly
- Recommendations must be actionable — "investigate this" is not a recommendation
- Link to the code, don't copy it — use file paths and line numbers

---

## Architecture Decision Records (ADRs)

### When to Write an ADR

Write an ADR when:
- The decision is **expensive to reverse** (schema change, API contract, service split)
- The decision **contradicts a common pattern** ("we chose X instead of Y, and here's why")
- A future engineer will **question this choice** without context
- The trade-offs are **non-obvious** from the code alone

Do NOT write an ADR for:
- Obvious decisions with clear consensus
- Decisions that are easily reversible
- Implementation details (those belong in ARCHITECTURE.md)

### Standard ADR Format

```markdown
# ADR-NNN: [Title — describe the decision, not the problem]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN
**Deciders:** [Who was involved in the decision]

## Context

What situation or problem prompted this decision?
What constraints existed (technical, business, team, time)?
What made this decision non-obvious?

## Decision

State the decision in one clear sentence.
Then explain the reasoning — why this option over the alternatives.

## Consequences

**Positive:**
- Benefit 1
- Benefit 2

**Negative (trade-offs accepted):**
- Trade-off 1 and how it will be managed
- Trade-off 2 and why it's acceptable

**Neutral:**
- Side effect worth noting but neither good nor bad

## Alternatives Considered

### Option A: [Name]
Brief description. Why it was rejected.

### Option B: [Name]
Brief description. Why it was rejected.

## References

- Links to relevant PRs, issues, benchmarks, or external resources
```

### ADR Examples

**Good ADR title:** "Use ObjectItem pattern for polymorphic contract/office relationships instead of dedicated FK models"

**Bad ADR title:** "Database decision" (too vague), "Why we chose PostgreSQL" (too broad and obvious)

### Where to Put ADRs

**Option A — In service directory:**
```
services/jobs/ARCHITECTURE.md  ← inline ADR section at the bottom
```

Good for: decisions that are local to one service, team prefers single file.

**Option B — In docs/reports:**
```
docs/reports/2026-01-15/adr-object-item-polymorphic.md
```

Good for: cross-cutting decisions, decisions that need to be linked from multiple places, decisions with significant detail.

**Option C — Dedicated ADR directory:**
```
docs/adr/
├── 001-use-celery-for-async-tasks.md
├── 002-object-item-polymorphic-relations.md
└── README.md  ← index of all ADRs
```

Good for: teams that make many ADRs and want a browsable index.

Choose the option that matches existing repo conventions. Check if ADRs already exist before creating a new location.

---

## Post-Mortems

### When to Write

Write a post-mortem for:
- Any production incident with user impact (even brief)
- Data loss or corruption events
- Security incidents
- Significant performance degradation events
- Major deployment failures

Write a lightweight retrospective (not full post-mortem) for:
- Close calls that didn't reach production
- Development environment failures causing significant team disruption

### Blameless Culture

Post-mortems blame **systems and processes**, not individuals. The goal is to understand how the system allowed the failure, not to find who made a mistake.

Language guide:
```
❌ "Alice misconfigured the environment variable"
✅ "The environment variable was misconfigured — no validation existed to catch this at deploy time"

❌ "Bob forgot to add the migration"
✅ "The migration was missing — the deployment process did not verify schema state before routing traffic"
```

### Standard Post-Mortem Structure

```markdown
# Post-Mortem: [Incident Title]

**Date of Incident:** YYYY-MM-DD
**Duration:** [Start time → End time, timezone]
**Severity:** P1 (Critical) | P2 (High) | P3 (Medium) | P4 (Low)
**Status:** Draft | In Review | Published

---

## Impact Summary

- **Users affected:** [Number or percentage, or "all users"]
- **Features affected:** [Specific features or "all features"]
- **Data impact:** None | Degraded data | Data loss | Data corruption
- **Revenue impact:** [If applicable]

One paragraph: what happened from the user's perspective.

---

## Timeline

All times in UTC.

| Time | Event |
|---|---|
| 14:23 | Alert triggered: P95 latency > 5s on /api/candidate/ |
| 14:27 | On-call engineer acknowledged, began investigation |
| 14:31 | Identified database connection pool exhaustion as likely cause |
| 14:35 | Increased pool size via config change, deployed |
| 14:38 | Latency returned to normal. Incident declared resolved. |

---

## Root Cause Analysis

### Root Cause

[The fundamental system or process failure that allowed this to happen]

Example: "Connection pool size was set to 10 (default), but a new background job introduced during the last release spawned 15 concurrent connections, exhausting the pool and causing request queuing."

### Contributing Factors

Factors that made the root cause possible or worse:
- Missing alert threshold for connection pool utilization
- Default config was never reviewed against production traffic patterns
- Background job pool isolation was not implemented

### Why It Wasn't Caught Sooner

Explain the detection gap — what monitoring was missing, what signal was ambiguous.

---

## Resolution

What was done to resolve the incident:
1. Immediate mitigation (bought time)
2. Root cause fix
3. Verification

---

## Action Items

| Action | Owner | Due Date | Status |
|---|---|---|---|
| Add connection pool utilization alert | Platform team | 2026-03-15 | Open |
| Review all background job concurrency limits | Service owners | 2026-03-22 | Open |
| Add connection pool isolation for background jobs | Platform team | 2026-03-29 | Open |
| Document pool sizing guidelines in ARCHITECTURE.md | Author | 2026-03-10 | Open |

---

## Lessons Learned

### What Went Well
- Alerting fired within 4 minutes of the issue starting
- Incident communication was clear and timely
- Resolution was fast once the root cause was identified

### What Went Poorly
- No visibility into connection pool utilization until exhaustion
- Root cause took 8 minutes to identify (should have been faster with better dashboards)

### What We'd Do Differently
- Add connection pool metrics before launching the next background job feature
- Create a runbook for database connection pool issues
```

### Post-Mortem Review Process

1. Author completes the draft within 48 hours of incident resolution
2. Team reviews within 1 week (async or sync, depending on severity)
3. Action items are added to the issue tracker
4. Published post-mortem is linked from the incident ticket

---

## Migration Guides

### When to Write

Write a migration guide for:
- Database schema changes that require data migration
- API breaking changes (deprecated endpoints, changed request/response shapes)
- Major dependency upgrades requiring code changes
- Service restructuring that changes how callers interact with a service
- Environment variable renames or additions

### Structure

```markdown
# Migration Guide: [From → To, or Feature Name]

**Date:** YYYY-MM-DD
**Affects:** [Who needs to run this — all engineers, specific services, consumers of API v1, etc.]
**Estimated time:** [How long this migration takes to execute]

---

## Why This Migration

Brief explanation of what changed and why. Link to the ADR or issue if it exists.

## Prerequisites

- [ ] Prerequisites that must be true before starting
- [ ] Dependency version requirements
- [ ] Environment access needed

## Before State

What the system looks like before this migration (schema, config, code pattern).

```python
# Old pattern
from services.jobs import JobSerializer  # Old import path
```

## After State

What the system looks like after this migration.

```python
# New pattern
from services.jobs.serializers import GlobalJobSerializer  # New path + class name
```

## Migration Steps

Execute these steps **in order**. Do not skip steps.

### Step 1: [Step Name]

```bash
# Exact commands to run
python manage.py migrate jobs 0042
```

Expected output:
```
Applying jobs.0042_add_object_item_fk... OK
```

### Step 2: [Step Name]

[Instructions]

Verification: [How to confirm this step succeeded]

### Step 3: ...

---

## Rollback Plan

If the migration fails at any step, here's how to safely reverse:

### Rollback Step 1: ...

```bash
python manage.py migrate jobs 0041
```

---

## Verification

After completing all steps, verify the migration succeeded:

```bash
# Verification commands and expected outputs
python manage.py check
pytest tests/integration/test_jobs_migration.py
```

---

## Known Issues

[Any known edge cases or caveats discovered during testing]
```

---

## Investigation Reports

For lightweight investigations (not full audits), use a condensed format:

```markdown
# Investigation: [What Was Investigated]

**Date:** YYYY-MM-DD
**Trigger:** [What prompted this — ticket link, Sentry error, user report]

## Summary

2–3 sentences: what was found and what the recommendation is.

## Findings

[Numbered findings with evidence]

## Recommendation

[Single clear action or set of actions]

## Evidence

[Logs, query outputs, Sentry links, screenshots]
```

---

## One-Off Doc Anti-Patterns

| Anti-pattern | Problem |
|---|---|
| Starting the doc after the decision is finalized | ADR captures context, not just the answer — write during the decision |
| Post-mortem delayed more than 72 hours | Details are lost, action items never get created |
| "TBD" action items with no owner or due date | They will never be done |
| Migration guide without rollback | Dangerous — always document how to undo |
| Report findings without evidence | Unverifiable — always link to data |
| Too many action items (10+) | Overwhelming — prioritize the top 3 critical ones |
