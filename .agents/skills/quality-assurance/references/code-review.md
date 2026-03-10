# Code Review Reference

## Review output contract

When delivering a review, lead with findings, ordered by severity. Each finding should answer:
- what is wrong
- why it matters
- where it lives
- what evidence supports it
- what change would resolve it

Preferred severity levels:
- `critical`: blocks merge; security, crashes, data corruption, irreversible rollout risk
- `important`: fix before merge; correctness bugs, missing regression coverage, performance regressions
- `minor`: worthwhile but non-blocking; clarity, maintainability, refactor opportunities
- `question`: seeks missing context
- `nit`: cosmetic and optional

## High-signal review checklist

Review in this order:

1. Correctness and acceptance criteria
2. Data integrity, auth, and safety
3. Backward compatibility and contracts
4. Test coverage and missing regression cases
5. Performance, concurrency, and scale
6. Observability and diagnosability
7. Rollout, migration, and CI implications
8. Documentation for risky or user-visible changes

Questions that routinely catch real bugs:
- What breaks if this branch runs twice?
- What happens on the unhappy path?
- Does this change alter a public field, payload, URL, event, or SQL shape?
- Is there any loop that hides IO or queries?
- If a retry happens, is the operation idempotent?
- If the reviewer removed every new test, what behavior would no longer be protected?

## Self-review before requesting review

Do not ask for review on an unreviewed diff.

1. Re-read the issue or spec.
2. Diff the branch against the intended base.
3. Review changed files in the order the runtime executes them.
4. Run the focused verification commands required by the repo or task.
5. Write the review request with scope, risk areas, and how to verify.

Useful prep commands:
```bash
git diff main...HEAD --stat
git diff main...HEAD
git log main...HEAD --oneline
```

Review request payload:
- what changed
- why it changed
- explicit non-goals
- risk areas
- local verification commands

## Receiving review feedback

Follow this sequence:

1. Read all feedback before reacting.
2. Restate each item in your own words or ask for clarification.
3. Verify against codebase reality.
4. Evaluate whether it is technically sound for this repo.
5. Respond with either a fix or reasoned pushback.
6. Implement one item at a time and verify each fix.

Do not use performative agreement. Replace vague praise with technical acknowledgment.

Bad:
- "You are absolutely right."
- "Great point."
- "Let me implement that now."

Better:
- "Fixed. The issue was X; changed Y to Z."
- "Verified. This would break Z because of X. I took the safe path instead."
- "Need clarification on item 3 before implementing the rest."

## Push back with evidence, not emotion

Push back when the comment:
- breaks existing behavior
- ignores established architecture or compatibility constraints
- asks for unused complexity
- mistakes a symptom for the root cause
- requests a pattern the repo intentionally avoids

Pushback template:
1. Restate the suggestion.
2. State what you verified.
3. Explain the conflict or cost.
4. Offer the smallest safe alternative or ask the decisive question.

Example:
`[important] I checked call sites and CI usage. This endpoint is unused today, so adding a cache layer would increase complexity without protecting a live path. Remove it instead, or point me to usage and I will optimize the hot path directly.`

If your pushback was wrong:
- "You were right. I verified against X and it does Y. Fixing now."

## Reviewing large diffs

For large PRs:
- identify the runtime-critical path first
- trace entrypoints before helpers
- ignore generated files until core logic is understood
- search for deletion of tests, logs, or permission checks
- look for duplicated conditionals or business rules appearing in new locations
- sample representative tests instead of reading all of them linearly

## Review heuristics by change type

### Data model or schema changes
- migration present, reversible, ordered correctly
- backfill or rollout plan defined
- indexes and nullability considered
- application reads tolerate mixed old and new data during rollout

### API or contract changes
- request and response shapes stable or versioned
- clients, docs, and tests updated together
- error semantics unchanged unless explicitly intended

### Frontend behavior changes
- loading, empty, error, and success states all covered
- optimistic updates or retries cannot duplicate actions
- accessibility and keyboard flows still work

### Async or job changes
- retries are safe
- duplicate execution is safe
- dead-letter or failure visibility exists
- timeouts and cancellation paths are deliberate

## PR Requirements

Before marking any PR ready for review, verify:

- [ ] CI is green (linters, type checker, unit tests at minimum)
- [ ] Coverage thresholds met
- [ ] Self-review using 10-category checklist completed
- [ ] Migration commands documented in PR description (if applicable)
- [ ] Breaking changes called out explicitly
- [ ] No secrets or credentials in the diff
- [ ] PR is one coherent unit of work (not multiple unrelated features)

---

## Review Anti-Patterns

| Anti-Pattern | What To Do Instead |
|---|---|
| Reviewing only the diff, not the context | Check callers, downstream effects, related tests |
| Approving without reading tests | Tests reveal intent better than the code |
| Rubber-stamp approvals | At least verify CI passes and tests exist |
| Requesting unrelated changes | Open a separate issue or PR |
| Bikeshedding on style | Defer to linter or house style guide |
| Ignoring security concerns | Flag every input validation gap |
| "LGTM" on untested code | Require tests before approval |
| Approving with unresolved critical comments | Block merge until resolved |
