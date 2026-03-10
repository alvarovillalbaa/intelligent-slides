# Backend Testing Reference

## Scope

Use this reference for backend or service-heavy systems: APIs, domain services, databases, queues, schedulers, external integrations, and migrations.

## Test shape by layer

| Layer | What to prove | Typical tools |
|---|---|---|
| Unit | pure logic, parsing, validation, policy decisions | pytest, vitest, rspec, go test |
| Integration | DB writes, HTTP handlers, serialization, auth, queues, jobs | pytest-django, supertest, rspec request specs |
| Contract | request or event shape to external systems | pact, schema assertions, fixture-based contract tests |
| End-to-end | high-value workflows across multiple layers | browser or API-driven flows |

## API and transport tests

For API routes or controllers:
- test success, auth, validation failure, not-found, and conflict paths
- assert response shape and persisted state together
- prefer real routing and middleware over direct handler invocation when the transport matters
- if serialization is a contract, assert field names and error semantics explicitly

Useful checks:
- content type and status code
- auth and permission boundaries
- pagination, filtering, ordering
- idempotency for create or retry paths
- error payload stability

## Domain and service tests

If the architecture uses a service layer, treat it as the primary home for business logic tests.

- unit-test pure policy and transformation functions
- integration-test services that touch DB, queues, or multiple repositories
- avoid mocking the service under test from one layer above if that hides behavior you actually care about
- verify side effects directly: rows written, events emitted, calls made to true external boundaries

## Database tests

Use real persistence when the behavior depends on:
- constraints
- transactions
- nullability
- locking or concurrency
- indexes and query count
- serialization of actual stored values

Test migration and rollout risk when schemas change:
- forward migration
- rollback viability if the platform expects it
- mixed-version compatibility when old and new app versions may overlap
- backfills on realistic data volume if the change is risky

## Jobs, queues, and async workers

For background work:
- test retry safety and idempotency
- test timeout, cancellation, and dead-letter behavior when supported
- use eager or inline execution only when it still proves the behavior
- add at least one path that exercises the real job envelope if the queue contract matters

Common bugs to catch:
- duplicated side effects on retry
- stale reads before transaction commit
- missing correlation IDs or logging context
- jobs that succeed only because tests execute synchronously

## External integrations

Mock or emulate the boundary, not the internal caller.

- keep fixture payloads realistic and versioned
- assert both outbound request shape and inbound failure handling
- test rate limits, timeouts, partial failures, and malformed payloads
- prefer contract fixtures or schema checks over hand-built dict fragments

## Concurrency and correctness

Backend bugs often appear only under race or retry conditions. Add explicit tests for:
- double submission
- duplicate webhook delivery
- concurrent updates to the same row or entity
- stale cache after mutation
- read-after-write timing assumptions

When true concurrency is hard to automate, define the exact manual or load-test proof instead of pretending a unit test covers it.

## Stack-specific defaults

### Python

- `pytest` for all layers
- use real DB for ORM behavior
- freeze time when temporal logic matters
- keep fixtures in `conftest.py` or local factories

### Node or TypeScript

- `vitest` or `jest` for unit and integration
- `supertest` for HTTP layers
- use `msw` or explicit fetch mocking for outbound HTTP
- assert runtime and type contracts separately

### Ruby

- `rspec` request or model specs for Rails
- factories over ad hoc model creation
- transactional cleanup unless the test truly needs committed state

### Go

- prefer table-driven unit tests
- use ephemeral containers for DB-backed integration
- verify context cancellation and timeout behavior explicitly
