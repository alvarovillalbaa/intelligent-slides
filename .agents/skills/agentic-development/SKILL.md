---
name: agentic-development
description: End-to-end repository execution workflow for implementing, debugging, refactoring, reviewing, instrumenting, and shipping code in any software repo. Use when the assistant needs to orient in an unfamiliar codebase, choose between working on main, branches, or worktrees, distinguish specs from plans from tests, coordinate subagents or parallel agents, handle PRs and review comments, inspect observability, or finish work without leaving loose ends.
---

# Agentic Development

Drive work through one loop: orient, choose the collaboration mode, choose the execution mode, implement, review, verify, and compound. Treat repository-local instructions and existing architecture as the source of truth.

## Start Here

1. Run the repository scan helper if one is bundled with the skill; otherwise perform an equivalent manual scan from the repo root.
2. Read the instruction files the scan finds before making workflow or architecture assumptions.
3. Inspect git state: branch, dirty files, worktrees, and PR context if relevant.
4. Decide whether the task is direct implementation, spec clarification, plan execution, debugging, review, instrumentation, or release cleanup.
5. Load only the reference files relevant to the current task.

## Core Rules

- Prefer repo-local instructions over generic advice. If `AGENTS.md`, `CLAUDE.md`, `SOUL.md`, `PRINCIPLES.md`, `PLANS.md`, `README.md`, `CONTRIBUTING.md`, or service/package docs exist, follow them in the hierarchy the repo defines.
- Do not force a branch change just because `main` is active. If the user is already on `main`, work there unless the task is risky enough to justify recommending a branch or worktree. Do not commit, push, or rewrite history on `main` without explicit user intent.
- Reuse existing seams. Extend current services, modules, primitives, models, and logging systems instead of creating parallel abstractions.
- Separate `spec`, `plan`, and `test` concerns. A spec defines the desired behavior. A plan defines the execution path. Tests prove the behavior.
- Verification gates claims. Do not say something is fixed, passing, or complete without fresh evidence.
- Use subagents deliberately. Split only by independent scopes or review roles. Do not let multiple agents edit the same files concurrently.
- Finish cleanly. Make the next integration step explicit instead of silently leaving the repo in an ambiguous state.

## Architecture Bias

Apply these defaults unless the repo clearly prefers something else:

- Maximize reuse and minimize total LOC.
- Prefer one authoritative implementation path over duplicated variants.
- Avoid repeated logic and near-duplicate code with the same purpose.
- Do not over-modularize. Split code only when independence, ownership, or readability materially improves.
- Favor cohesive vertical slices over scattering one concept across many files.

For Cloush-style backends, this usually means thin transport layers, service-owned business logic, multi-purpose data models, centralized logging, and a strong bias toward reuse over invention.

## Workflow Router

### Orientation and repo policy

Read [repo-orientation.md](./references/repo-orientation.md) for startup discovery, instruction-file handling, and repo-shape detection.

### Git, branches, worktrees, and PR flow

Read [collaboration-and-git.md](./references/collaboration-and-git.md) when the task touches branching strategy, worktrees, PRs, merging, or cleanup.

### Spec-driven, plan-driven, and test-driven delivery

Read [specs-plans-tests.md](./references/specs-plans-tests.md) when the user asks for a plan or spec, when scope is fuzzy, or when TDD should drive the work.

### Subagents and parallel work

Read [subagents-and-parallelism.md](./references/subagents-and-parallelism.md) for controller and worker patterns, review loops, and safe parallelization.

### Reviews, comments, and PR feedback

Read [reviews-and-comments.md](./references/reviews-and-comments.md) when reviewing code, receiving review feedback, or addressing GitHub, Sentry, or CI comments.

### Observability and debugging

Read [observability.md](./references/observability.md) before adding logs or instrumentation, and whenever debugging should start from existing signals.

### Backend execution

Read [backend-development.md](./references/backend-development.md) for service-layer, data-model, API, async, and architecture heuristics.

### Frontend execution

Read [frontend-development.md](./references/frontend-development.md) for design-system preservation, component boundaries, interaction quality, analytics, and refactor triggers.

### Verification and completion

Read [verification-and-finish.md](./references/verification-and-finish.md) before declaring success, opening or merging a PR, or cleaning up a branch or worktree.

## Skill Orchestration

If the current repo exposes more specialized skills, route work through them instead of bloating this skill:

- Use `create-plan` when the user explicitly asks for a plan.
- Use `architecture-advisor` when system mapping or impact analysis is the hard part.
- Use `test-assistant` when writing or repairing tests is the bottleneck.
- Use `gh-address-comments` for GitHub review-thread triage and inline replies.
- Use `gh-fix-ci` when GitHub Actions checks are failing.
- Use `ui-skills`, `building-components`, `frontend-design`, or `component-refactoring` when the repo includes them and the task is frontend-heavy.
- Use repo-specific instrumentation skills for Sentry, PostHog, or analytics when they exist. Otherwise, follow [observability.md](./references/observability.md).

## Completion Hook

If the host supports stop hooks or pre-finish hooks, wire in [check-completion.sh](./hooks/check-completion.sh). The hook blocks premature stopping and forces a final pass over the original request, plan or spec state, verification evidence, recent errors, and integration cleanup.

Example Claude-style hook registration:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/agentic-development/hooks/check-completion.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Set `AGENTIC_DEV_MAX=0` for no continuation cap, or any positive integer to limit repeated stop interceptions.
