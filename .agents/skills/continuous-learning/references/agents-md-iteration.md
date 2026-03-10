# Identity And Documentation Promotion

Use learning artifacts to improve the right source of truth. Do not promote everything everywhere.

## Promotion order

Promote in this order:

1. `learning/` artifacts
2. Identity files: `AGENTS.md`, `SOUL.md`, `PRINCIPLES.md`
3. Human-facing markdown docs that should persist for collaborators

If the knowledge is useful only as session memory, stop at `learning/`.

## File roles

| File | What belongs there | Update bar |
|---|---|---|
| `AGENTS.md` | Stable operating rules, repo facts, agent workflow constraints | Repeated or explicitly stated, actionable, durable |
| `SOUL.md` | Persistent style, tone, or collaboration stance | Rare, identity-level signal |
| `PRINCIPLES.md` | Decision heuristics and trade-off rules | Rare, heuristic clearly needed |
| `README.md` | Human-facing overview or usage facts | When a teammate would need it |
| `ARCHITECTURE.md` | Structural decisions, ownership, boundaries | When architecture changed or was clarified |
| `TESTS.md` / `TESTING.md` | Durable test workflows and pitfalls | When test strategy or gotchas changed |
| `SETUP.md` | Environment, setup, bootstrap behavior | When operational steps changed |
| `docs/cookbook/*` | Reusable technical guidance | When a pattern needs broader documentation |
| `docs/daily/*` | Brief historical log | When repo process expects daily notes |

## `AGENTS.md`

Update only when the signal is:

- stable across future sessions
- actionable enough to change agent behavior
- repeated at least twice, or explicitly stated as a durable rule
- not already covered by a more authoritative instruction

Maintain or add these sections when needed:

```markdown
## Learned Preferences

- ...

## Learned Codebase Facts

- ...
```

Do not store:

- secrets
- one-off task requests
- temporary branch or PR context
- contradictory bullets without resolving them

## `SOUL.md`

Update only for persistent tension in how the agent collaborates.

Examples:

- The user repeatedly corrects the agent to be more direct.
- The agent consistently over-explains and the correction is enduring.
- The team prefers a sharper review posture across sessions.

Do not change `SOUL.md` for a single hurried session.

## `PRINCIPLES.md`

Update when a missing or broken heuristic caused avoidable time loss or poor decisions.

Examples:

- A sync versus async choice keeps being re-litigated with the same answer.
- A migration safety heuristic proved necessary and repeatable.

Write concise heuristics that help future decision making.

## Other markdown docs

Promote there when the knowledge is for humans first, not just agents.

### Promote to `README.md` when

- the change affects how to use, run, or understand the repo
- a teammate would miss an important entry point without it

### Promote to `ARCHITECTURE.md` when

- module ownership changed
- a boundary or rationale was clarified
- a design constraint must remain visible

### Promote to `TESTS.md` or `TESTING.md` when

- a recurring test pattern or fixture rule emerged
- a known false assumption in tests was corrected

### Promote to `SETUP.md` when

- install, bootstrap, credentials flow, or local runtime setup changed

### Promote to `docs/cookbook/` when

- the knowledge is a reusable technical recipe
- it spans multiple modules or teams

## Conflict handling

If new knowledge conflicts with existing docs:

1. Check whether the old doc is stale.
2. If stale, update in place.
3. If the signal is still uncertain, keep it in `learning/` and record the open question in the episode or decision trace.
4. Do not publish contradictory guidance into `AGENTS.md`, `README.md`, or `ARCHITECTURE.md`.

## Promotion hygiene

- Update the smallest authoritative file that should own the knowledge.
- Prefer refining an existing section instead of appending another near-duplicate section.
- Mention source artifacts in the edit when useful, but do not clutter user-facing docs with internal bookkeeping.
