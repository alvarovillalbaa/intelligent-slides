# Memory Types

This system mirrors Clous's layered learning model, adapted for software repositories and local files.

## Overview

| Type | Role | Cadence |
|---|---|---|
| Items | Raw session signals | During work |
| Episodes | Session summary | Every meaningful session |
| Decision traces | Reflection and trade-offs | Reasoning-heavy sessions |
| Triples | Atomic facts | Session end |
| Lessons | Verified outcome knowledge | Session end, threshold-gated |
| Collections | Topic knowledge | Updated in place |
| Procedures | Repeatable workflows | When a workflow is reusable |
| Beliefs | Current synthesized model | When evidence accumulates |

## Items

Use items as the capture buffer. They are fast to append, low-friction, and intentionally unsynthesized.

Good uses:

- unexpected root causes
- failed attempts
- fixes
- architectural discoveries
- warnings worth revisiting later

## Episodes

Episodes are the per-session audit trail. They summarize what happened, what changed, what was learned, and what still remains open.

Write one after every meaningful debugging, implementation, review, or design session.

## Decision traces

Decision traces are the closest analog to Clous decision traces. Use them when the session involved:

- competing options
- uncertain evidence
- explicit trade-offs
- residual risk
- a need to explain why one path won

They are especially useful before updating `PRINCIPLES.md`, `SOUL.md`, or architecture docs.

## Triples

Triples store the smallest useful facts. They should be durable, concrete, and grep-friendly.

Triples are not summaries, narratives, or opinions.

## Lessons

Lessons are the highest-bar artifact. They represent things that should change future behavior because the outcome was clear and the insight is reusable.

Do not turn every fix into a lesson.

## Collections

Collections are the most common long-lived artifact. Use them for topic knowledge that is too broad for a triple and too lightweight for a lesson.

Collections should stay curated. Merge duplicates. Split oversized files by domain.

## Procedures

Procedures capture repeatable workflows that a future agent or teammate can follow without rediscovery.

Examples:

- safe migration workflow
- release checklist
- debug flow for flaky websocket tests

## Beliefs

Beliefs are the current synthesized state of understanding. They should be regenerated or edited in place when enough evidence exists.

Beliefs are not evidence themselves. They are a readable synthesis of episodes, decision traces, and triples.

## Relationship to docs and identity files

Use memory artifacts first. Then decide whether the knowledge also deserves promotion into:

- `AGENTS.md`
- `SOUL.md`
- `PRINCIPLES.md`
- `README.md`
- `ARCHITECTURE.md`
- `TESTS.md`
- `SETUP.md`

Promotion means the knowledge is now authoritative beyond the learning system.
