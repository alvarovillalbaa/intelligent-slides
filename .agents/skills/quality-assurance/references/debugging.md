# Debugging Reference

## Debugging loop

Never jump from symptom to fix. Use this order:

1. Reproduce the failure.
2. Reduce it to the smallest reliable case.
3. Read the full error, logs, or diff.
4. Correlate with recent code, config, or dependency changes.
5. Form one concrete hypothesis at a time.
6. Prove or falsify the hypothesis quickly.
7. Fix the root cause and verify with a regression proof.

## Triage the failure class first

| Failure class | Typical signal | First move |
|---|---|---|
| Crash or exception | stack trace, panic, unhandled rejection | read the full trace from root cause outward |
| Wrong output | no crash, wrong value or DOM | tighten assertions and isolate inputs |
| Flaky | passes sometimes | search for shared state, time, randomness, race conditions |
| CI-only | local passes, CI fails | diff env, OS, container, secrets, cached state |
| Performance | slow request, timeout, OOM | measure before changing code |
| Data or rollout issue | works on fresh data, fails on real data | inspect migrations, nullability, mixed-version compatibility |

## Read failures completely

Common mistake: reading only the last line.

- In stack traces, start at the root cause and work outward.
- In assertion failures, inspect expected vs actual values, local variables, and fixture setup.
- In CI logs, identify the first failing step, not just the final job summary.
- In browser failures, inspect console errors, network failures, screenshot or trace artifacts, and DOM timing.

## CI-only failure workflow

When something fails only in CI:

1. Compare runtime versions: language, package manager, browser, DB, OS image.
2. Compare env and secrets presence, not just values.
3. Compare working directory, path filters, and changed-files logic.
4. Check cache keys and stale artifact reuse.
5. Re-run the exact CI command locally or in a matching container if possible.
6. Inspect whether tests rely on wall clock, locale, timezone, filesystem ordering, or network availability.

Frequent causes:
- missing env var or secret
- path-dependent file lookup
- dependency drift between local and CI
- hidden reliance on local services or seeded data
- race condition exposed by slower or faster CI machines

## Regression correlation

Use history before guessing.

```bash
git log --oneline -- path/to/failing/file
git blame path/to/file
git diff <known-good>...HEAD -- path/to/file
git bisect start
```

Patterns that often explain sudden failures:
- new required field or schema change
- renamed import or moved symbol
- stricter auth or feature-flag logic
- altered serialization shape
- dependency upgrade or test runner upgrade
- hidden change in default timezone, locale, or clock

## Flaky test protocol

Flakes have causes. Find the dimension that changes:

- order: the test depends on another test having run first
- time: midnight, DST, token expiry, debounce, retry windows
- randomness: UUIDs, Faker, seeds, unstable sorting
- concurrency: unsafely shared resources, parallel workers, missing awaits
- environment: browser, OS, path casing, CPU speed, network availability
- leakage: global state, DB rows, files, sockets, mocks not reset

Useful tactics:
```bash
pytest path::test_name -x -vv
pytest path::test_name --count=20
pytest --randomly-seed=<seed>
npx playwright test --repeat-each=10
```

Fixes usually involve:
- hermetic setup and teardown
- fake or frozen time
- deterministic data
- replacing `sleep()` with explicit wait conditions
- isolating shared mutable state
- reducing reliance on test order or global caches

## Performance debugging

Measure first. Performance bugs often masquerade as correctness bugs in CI.

Watch for:
- N+1 queries or repeated HTTP calls in loops
- repeated rendering or expensive selectors in UI
- full-table scans, missing indexes, or no pagination
- loading unbounded data into memory
- retries without backoff or cancellation

Good proof patterns:
- query count assertions for hot endpoints
- benchmark or profiling comparison before and after the change
- browser traces and performance profiles for UI regressions
- memory snapshots for leaks or runaway caches

## Observability-led debugging

If logs, metrics, traces, or artifacts already exist, use them before adding new instrumentation.

Useful evidence sources:
- structured error logs with request or trace IDs
- CI artifacts: screenshots, videos, junit XML, coverage XML
- DB slow query logs
- browser console and network traces
- queue retries, dead-letter queues, worker heartbeats

Add instrumentation only after confirming existing signals are insufficient, and remove temporary noise once the issue is resolved.
---

## Error Pattern Reference

### Python / Django

| Error | Common Cause | Fix |
|---|---|---|
| `KeyError: 'field'` | Dict access without `.get()` | `data.get('field')` with guard |
| `AttributeError: 'NoneType'` | FK or `.get()` returned None | Null check before attribute access |
| `OperationalError: no such column` | Migration not applied | `python manage.py migrate` |
| `ValidationError: {...}` | Required field missing in request | Check required fields in serializer |
| `IntegrityError: UNIQUE constraint` | Duplicate insert | Check for existing record first |
| `DoesNotExist` | `.get()` with no match | Use `.filter().first()` or handle exception |
| `MultipleObjectsReturned` | `.get()` with multiple matches | Add more specific filter |
| `RecursionError` | Circular signal or recursive call | Check signal handlers; add recursion guard |
| `celery.exceptions.Retry` | Task explicitly retrying | Expected; check max_retries |

### JavaScript / TypeScript

| Error | Common Cause | Fix |
|---|---|---|
| `TypeError: Cannot read property 'x' of undefined` | Missing null check | Optional chaining: `obj?.x` |
| `TypeError: x is not a function` | Wrong type passed | Check type before calling |
| `UnhandledPromiseRejection` | Missing `await` or `.catch()` | Add try/catch or `.catch()` |
| `ReferenceError: x is not defined` | Incorrect import or scope | Check import paths |
| `Maximum call stack size exceeded` | Infinite recursion | Add base case; check event listeners |
| `CORS error` | Missing CORS header | Configure server CORS; check origin |
| `Hydration mismatch` | SSR/CSR output differs | Ensure same rendering logic on server and client |

---

## CI-Only Failure Patterns

When a test passes locally but fails in CI:

| Pattern | Cause | Fix |
|---|---|---|
| Missing env var | CI doesn't have the same `.env` | Add to CI secrets; check `required_env_var` guards |
| Different Python/Node version | CI uses different runtime | Pin version in CI config |
| Missing migration | Local DB has extra state; CI starts fresh | Ensure migration is committed |
| Port conflict | CI runs multiple services on same port | Use dynamic ports or wait logic |
| Timezone difference | CI runs in UTC; local is different | Freeze time in tests; don't rely on local timezone |
| DB not ready | CI starts DB in parallel with tests | Add health checks / wait-for-it scripts |
| Missing `git fetch` | Shallow clone in CI misses history | Use `fetch-depth: 0` in CI config |

---

## Debugging Async Code

```python
# Python async — use asyncio.run in tests
import asyncio
import pytest

@pytest.mark.asyncio
async def test_async_operation():
    result = await my_async_function()
    assert result == expected

# Django async views
from django.test import AsyncClient

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_async_view():
    client = AsyncClient()
    resp = await client.get('/api/async-endpoint/')
    assert resp.status_code == 200
```

```typescript
// JavaScript async — always await assertions
it('fetches data', async () => {
  const data = await fetchData()
  expect(data).toEqual({ id: 1 })
})

// React async rendering
it('shows data after loading', async () => {
  render(<DataComponent />)
  await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument())
})
```
