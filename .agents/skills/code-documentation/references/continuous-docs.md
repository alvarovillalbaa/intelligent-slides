# Continuous Documentation Reference

Continuous docs are written and maintained as part of the regular development flow. They don't require planning or approval — they're habits, not projects.

---

## Daily Development Logs

### Purpose

The daily log is the engineering team's shared memory. It answers: "what changed today, and why?" — a question that becomes critically important during incident debugging, code archaeology, and onboarding.

### Finding the Right File

**Rule: Always append to the latest existing date file. Never create new files unless today's date doesn't exist yet.**

```bash
# Find the latest daily log file
ls docs/daily/ | sort | tail -1

# Append a log entry
echo "- Fixed failing OAuth tests by mocking token exchange properly" >> docs/daily/2026-03-08.md
```

If today's date file doesn't exist, check repo conventions — some teams create files weekly or sprint-by-sprint. Follow whatever pattern the latest files show.

### Format

One bullet per logical change. 2 lines maximum. Past tense. Active voice.

```
- [What changed] — [Why it changed or what problem it solved]
```

**Examples (good):**
```
- Fixed OAuth token refresh by adding missing redirect URI validation — was causing silent login failures on mobile
- Refactored candidate serializer to use RetrievalLevelMixin — removed ad-hoc to_representation override
- Added retry logic to MCP handshake — Anthropic endpoint returns 503 on cold start
- Bumped OpenAI SDK to 1.35.0 — required for structured output support in streaming mode
- Removed deprecated JobSkillLink model — migrated all FK references to ObjectItem pattern
```

**Examples (bad):**
```
- Did some refactoring
- Fixed a bug
- Updated code per review
- WIP
```

### When to Write

Write a log entry for:
- Any code change that makes it to the repo (even small ones)
- Config or environment changes
- Infrastructure changes
- Documentation changes that change behavior
- Dependency updates
- Migrations

Do NOT write log entries for:
- Commits that were immediately reverted
- Formatting-only changes (linting passes)
- WIP commits that are squashed before merge

### Tone

Technical, not narrative. Write it for your future debugging self, not for a blog post. Be specific — version numbers, function names, error messages — these make entries searchable.

---

## Changelogs

### Two Changelog Audiences

**Internal (daily logs):** What changed in the code and why — for engineers.

**Customer-facing (docs/changelog/):** What changed in the product — for users and stakeholders.

These serve completely different audiences and must be written separately.

### Customer-Facing Changelog

**Location:** `docs/changelog/YYYY-MM-DD/` or `docs/changelog/YYYY-MM-DD-release-name.md`

**When to write:** At every public release. Written after the release is live, not before.

**Tone:** Plain language. Present tense ("Job matching now considers..."). No technical jargon. No internal class names. No error codes. User-impact focused.

**Structure:**
```markdown
## [Version or Date] — Release Name (optional)

### New
- Job matching now considers candidate work preferences when scoring roles
- Notifications now support digest mode — batch daily or weekly instead of per-event

### Improved
- Candidate search is 3x faster on large datasets
- Dashboard load time reduced from 4s to under 1s

### Fixed
- Fixed an issue where some users saw duplicate notifications after reconnecting
- Fixed a layout issue in the sidebar on smaller screens

### Removed
- Removed legacy CSV export format — use the new Excel export instead
```

**Anti-patterns:**
```
# Bad — technical, jargon-heavy
- Migrated CandidateSerializer to RetrievalLevelMixin (removed to_representation override)
- Fixed N+1 query in JobListView via select_related('company', 'location')

# Good — user-focused
- Improved job list loading time for companies with many active roles
```

### Semantic Versioning in Changelogs

When the repo uses semver:
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes — document migration path
- **MINOR** (1.0.0 → 1.1.0): New features — document what's new
- **PATCH** (1.0.0 → 1.0.1): Bug fixes — document what was fixed

For internal tools and APIs, document breaking changes with an upgrade guide in `docs/plans/`.

---

## API Documentation

### REST APIs

Every API endpoint needs documentation covering:

1. **HTTP method and path**
2. **Purpose** (what the endpoint does, not how)
3. **Authentication requirements**
4. **Request body schema** (field names, types, required/optional, constraints)
5. **Query parameters** (if applicable)
6. **Response schema** for each status code
7. **Error codes** the endpoint can return

**Docstring format (Django/DRF example):**
```python
class CandidateViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for candidate profiles.

    Authentication: JWT required on all actions.
    Permissions: Company-scoped — users can only access candidates in their company.

    Endpoints:
        GET    /api/candidate/          - List candidates (paginated, filterable)
        POST   /api/candidate/          - Create new candidate
        GET    /api/candidate/{id}/     - Retrieve single candidate
        PUT    /api/candidate/{id}/     - Full update
        PATCH  /api/candidate/{id}/     - Partial update
        DELETE /api/candidate/{id}/     - Soft delete (sets is_deleted=True)

    Filters (GET /api/candidate/):
        - status: active|inactive|archived
        - job_id: UUID — filter by assigned job
        - search: text search across name, email

    Response levels (pass ?level=basic|detailed|full):
        - basic: id, name, email, status
        - detailed: + skills, experience, education (default)
        - full: + audit trail, internal notes
    """
```

**OpenAPI annotations (FastAPI/DRF-spectacular):**
```python
@extend_schema(
    summary="List candidates",
    description="Returns paginated list of candidates scoped to the authenticated company.",
    parameters=[
        OpenApiParameter("status", description="Filter by status", enum=["active", "inactive", "archived"]),
        OpenApiParameter("level", description="Response detail level", enum=["basic", "detailed", "full"]),
    ],
    responses={200: CandidateSerializer(many=True), 403: ErrorSerializer},
)
def list(self, request, *args, **kwargs):
    ...
```

### GraphQL APIs

For GraphQL schemas, document:
- Each type with a description field
- Each field with its purpose and any constraints
- Each query/mutation with arguments, return type, and auth requirements

```graphql
"""
A candidate in the recruitment pipeline.
Scoped to the authenticated user's company.
"""
type Candidate {
  id: ID!
  """Full name as provided during application."""
  name: String!
  """Email address — used as login identifier."""
  email: String!
  """Current pipeline stage."""
  status: CandidateStatus!
}
```

### WebSocket / Event-Driven APIs

For WebSocket or event-driven systems, document:
- Event names and when they fire
- Payload schema for each event
- Error events and recovery behavior
- Connection lifecycle (connect, authenticate, reconnect, disconnect)

---

## Inline Code Documentation Cadence

### When to Update Existing Docs

Update inline docs when:
- The function's behavior changes (even slightly)
- A parameter is added, removed, or its meaning changes
- The return value shape changes
- A new exception can be raised

Update service docs when:
- The service's public API changes
- Key architectural patterns change
- A new testing approach is introduced

### Staleness Detection

Stale documentation is worse than missing documentation — it actively misleads.

Signs a doc is stale:
- Example code doesn't work when copy-pasted
- Described parameters don't exist in the function signature
- Referenced module names don't exist anymore
- Version numbers mentioned are obsolete

When encountering stale docs: fix them in the same PR as the code change that made them stale. Never leave a known-stale doc uncorrected.

---

## README Maintenance

READMEs are living documents — they should be updated whenever the service's behavior, API, or recommended usage changes.

### README Health Checklist

Run this checklist whenever modifying a service significantly:

- [ ] One-sentence description still accurate?
- [ ] "When to use" section still reflects current guidance?
- [ ] Quick start example still works?
- [ ] All linked files still exist?
- [ ] No references to deleted classes, functions, or modules?
- [ ] Version requirements up to date?
- [ ] No outdated environment variable names?

### When NOT to Update the README

- For internal refactors with no behavioral change
- For bug fixes with no API surface change
- For test additions

---

## Frontend Component Documentation

### Storybook

When the project uses Storybook, each component story IS the documentation. Maintain stories that cover:

1. **Default state** — the most common usage
2. **All significant variants** — different props that produce different output
3. **Edge cases** — empty states, error states, loading states, truncated content
4. **Interactive states** — hover, focus, disabled, selected

Each story should have:
```typescript
export default {
  title: 'Components/CandidateCard',
  component: CandidateCard,
  parameters: {
    docs: {
      description: {
        component: 'Compact display card for a single candidate. Used in pipeline boards and list views.',
      },
    },
  },
} satisfies Meta<typeof CandidateCard>;
```

### Component README (when no Storybook)

When Storybook isn't available, document components in their directory:

```
components/CandidateCard/
├── CandidateCard.tsx
├── CandidateCard.test.tsx
└── README.md
```

`README.md` must cover: purpose, props table, usage example, variants.

---

## Continuous Doc Quality Signals

### Good continuous doc signals:
- Daily logs written within hours of the change, not days later
- Changelogs readable by a non-engineer
- Inline docs updated in the same PR as the code change
- READMEs that pass their own quick-start instructions

### Warning signals:
- Daily log entries written in bulk days after the changes
- Changelogs with implementation details ("fixed N+1 query")
- Inline docs that reference deleted parameters
- "TODO: document this" comments older than one sprint
