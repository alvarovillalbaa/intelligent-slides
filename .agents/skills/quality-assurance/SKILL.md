---
name: "quality-assurance"
description: "End-to-end quality assurance for any software repo: code review, test strategy, bug triage, debugging, flaky-test repair, coverage improvement, suite architecture, and CI/CD quality gates for frontend, backend, or full-stack systems. Use when reviewing PRs, receiving review feedback, writing tests, fixing failing or flaky tests, scaling large suites, enforcing lint/type/build/test/security checks, improving release confidence, or wiring reliable verification into local workflows and CI."
---

# Quality Assurance

Quality assurance is a delivery system, not a phase. Reconstruct intended behavior, choose the cheapest evidence that can prove or falsify it, then wire the same verification into repeatable local and CI workflows.

## Start Here

1. Run `python .agents/skills/quality-assurance/scripts/qa-scan.py .` from the repo root.
2. Reuse existing repo commands from `Makefile`, `package.json`, `pyproject.toml`, `tox.ini`, `noxfile.py`, `justfile`, `Taskfile.yml`, or CI config before inventing new ones.
3. Read repo-local instructions before deciding whether to run tests, what thresholds apply, or which folders own coverage.
4. Load only the reference files that match the task.
5. State the verification command before making any success claim.

## Operating Rules

- Evidence before claims. Do not say fixed, passing, or complete without fresh command output.
- Reproduce before repair. A regression test is part of the fix.
- Use the lowest-fidelity test that can actually prove the behavior. Escalate only when cheaper layers cannot prove it.
- Mock boundaries, not business logic.
- Test behavior, contracts, and side effects. Avoid implementation-detail assertions unless the implementation itself is the contract.
- Respect repo-local rules for when tests may be run, which suites are mandatory, and how CI is wired.
- Review comments are technical claims to evaluate, not social cues to obey.
- Flaky tests are bugs. Quarantine is temporary containment, not completion.
- Coverage is a lagging indicator. Use it to find blind spots, not to justify weak tests.
- At scale, speed comes from suite architecture, hermetic setup, sharding, and disciplined selection.

## QA Router

### Repo and stack detection

Use `scripts/qa-scan.py`. It detects likely languages, frameworks, test runners, linters, and CI providers, then suggests which references to load and which commands probably matter.

### Code review and review feedback

Read [references/code-review.md](./references/code-review.md) for:
- review output format
- severity taxonomy
- self-review before requesting review
- receiving feedback and pushing back with evidence

### Test strategy and regression design

Read [references/test-strategy.md](./references/test-strategy.md) for:
- test type selection
- red-green-refactor and regression rules
- mocking, fixtures, and data strategy
- coverage interpretation

### Backend-heavy QA

Read [references/backend-testing.md](./references/backend-testing.md) for:
- APIs, services, jobs, queues, migrations, and contracts
- common backend stack patterns
- database and concurrency concerns

### Frontend-heavy QA

Read [references/frontend-testing.md](./references/frontend-testing.md) for:
- component, integration, browser, accessibility, and visual testing
- async UI control
- network and time handling

### Failure triage and debugging

Read [references/debugging.md](./references/debugging.md) for:
- failing tests
- CI-only failures
- flaky tests
- performance and observability-led debugging

### CI/CD and quality gates

Read [references/ci-cd.md](./references/ci-cd.md) for:
- local-to-CI parity
- pipeline staging
- caching, sharding, artifacts, and branch protection
- provider patterns for common CI systems

### Suite scaling and monorepos

Read [references/suite-architecture.md](./references/suite-architecture.md) for:
- ownership
- test selection
- quarantine policy
- monorepo and large-suite design

### Completion and release verification

Read [references/verification.md](./references/verification.md) before saying something is fixed, asking for merge, or treating a release as ready.

### Anti-pattern sweep

Read [references/anti-patterns.md](./references/anti-patterns.md) for fast smell detection across review, testing, debugging, and CI.

## Standard Loops

### Review loop

1. Reconstruct intended behavior from the issue, PR description, or diff.
2. Review highest-risk paths first: correctness, data integrity, auth, concurrency, performance.
3. Emit findings with severity, impact, and concrete file or command evidence.
4. Propose the smallest safe fix or the precise follow-up question needed to unblock.
5. Verify changed behavior with focused commands.

### Bug-fix loop

1. Reproduce.
2. Isolate the smallest failing case.
3. Add or identify a failing regression test.
4. Fix the root cause.
5. Run the focused proof command, then broader regression commands.

### Test-authoring loop

1. Decide which layer owns the behavior.
2. Build data with factories, builders, or fixtures instead of ad hoc duplication.
3. Assert observable outcomes.
4. Remove timing, order, and environment sensitivity.
5. Wire the command into local scripts and CI if it protects a critical behavior.

### CI hardening loop

1. Inventory commands already trusted locally.
2. Split fast gates from slow gates.
3. Parallelize only isolated jobs.
4. Cache dependencies and reusable artifacts.
5. Publish logs and artifacts that make failures diagnosable.
6. Enforce merge protection only on stable, high-signal jobs.

## Helper Scripts

- `scripts/qa-scan.py`: detect stack, runners, CI providers, and likely QA commands.
- `scripts/qa-check.sh`: run lint, type, and test commands across common Python, JS, Ruby, and Go repos.
- `scripts/coverage-report.sh`: run coverage with configurable thresholds across common runners.

## Skill Orchestration

- Use `test-assistant` when the bottleneck is writing or repairing concrete tests.
- Use `gh-fix-ci` when GitHub Actions failures need log retrieval and implementation.
- Use security or cloud-specific skills when the QA problem depends on those systems.
- Use repo-specific build, deploy, or observability skills when the failure depends on that tooling.

## Exit Criteria

Do not stop on "likely fixed". Stop on reproduced failure, root-cause explanation, regression protection, fresh verification output, and a clear statement of residual risk if verification is partial.
