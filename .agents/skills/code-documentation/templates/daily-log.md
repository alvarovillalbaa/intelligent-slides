# Daily Log Template

Daily logs go in `docs/daily/YYYY-MM-DD.md` — always append to the latest existing file, never create new ones unless today's date doesn't exist yet.

---

## Format

```
- [What changed and why] — [Context or problem solved, if not obvious]
```

One bullet per logical change. One or two lines maximum. Past tense. Active voice.

---

## Examples

### Feature additions
```
- Added retry logic to MCP handshake — Anthropic endpoint returns 503 on cold start
- Implemented candidate deduplication in import pipeline — was creating duplicate profiles on re-import
- Added `level` query param to /api/candidate/ — enables callers to choose response verbosity
```

### Bug fixes
```
- Fixed OAuth token refresh by adding missing redirect URI validation — was causing silent login failures on mobile
- Fixed N+1 query in JobListView — added select_related('company', 'location') to queryset
- Fixed race condition in notification dispatch — added task_id deduplication check before enqueuing
```

### Refactors
```
- Refactored CandidateSerializer to use RetrievalLevelMixin — removed ad-hoc to_representation override
- Moved candidate enrichment logic from view into CandidateService — was incorrectly in view layer
- Consolidated duplicate MCP connection logic into MCPConnectionPool singleton
```

### Config / infra changes
```
- Bumped OpenAI SDK to 1.35.0 — required for structured output support in streaming mode
- Increased Celery worker pool size from 4 to 8 on `async` queue — was bottlenecking bulk imports
- Added SENTRY_TRACES_SAMPLE_RATE env var — enables configurable APM trace sampling without deploy
```

### Migrations
```
- Added GinIndex on search_vector field in jobs_job — reduces full-text search from 800ms to 40ms
- Migrated JobSkillLink FK to ObjectItem pattern — part of polymorphic relations refactor
- Added company_id index on candidate_candidate — required for multi-tenant query isolation
```

### Documentation
```
- Added ARCHITECTURE.md for services/mcp — documents connection lifecycle and tool filtering
- Updated services/agents/README.md to reflect ConversationResultHandler consolidation
```

---

## Anti-patterns to Avoid

```
❌ - Did some refactoring
❌ - Fixed a bug
❌ - Updated code per review feedback
❌ - WIP
❌ - Various improvements
❌ - Code review changes
```

These are not useful to anyone — they contain no searchable information.

---

## Finding the Latest Log File

```bash
# Find the latest file
ls docs/daily/ | sort | tail -1

# Append to it
echo "- Your log entry here" >> docs/daily/$(ls docs/daily/ | sort | tail -1)
```

Or use: `.agents/skills/code-documentation/scripts/find-docs.sh`
