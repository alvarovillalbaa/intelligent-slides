# Test Strategy Reference

## Contents

- Selecting the proving layer
- Red-green-refactor and bug-fix rules
- Test design heuristics
- Data and mocking rules
- Coverage interpretation
- Release-oriented test portfolios

## Select the proving layer first

Pick the cheapest test that can actually prove the behavior. If a lower layer cannot prove the claim, move up one layer.

| Behavior to prove | Primary proof path | Notes |
|---|---|---|
| Pure transform or algorithm | Unit | No DB, no network, no browser |
| Service or domain rule with persistence | Integration | Use real DB, mock external boundaries |
| HTTP contract, auth, serialization, routing | Integration | Exercise the real transport layer |
| User flow across pages, services, or jobs | E2E | Keep few, critical, stable |
| Production readiness gate | Smoke | Use only for highest-value checks |
| Third-party contract compatibility | Contract or integration | Assert request/response shape |

Use one primary proof path per behavior. Do not duplicate the same assertion in five layers unless each layer protects a different risk.

## Red-green-refactor is the default loop

For new logic:
1. Write a failing test that expresses the behavior.
2. Run it and confirm it fails for the right reason.
3. Implement the minimum change to make it pass.
4. Refactor without changing behavior.
5. Re-run the focused test, then the broader safety net required by repo policy.

For bug fixes:
1. Reproduce the bug.
2. Encode the bug as a failing regression test.
3. Confirm the test fails before the fix.
4. Fix the root cause.
5. Confirm the focused regression test passes.
6. Run the surrounding suite that protects adjacent behavior.

If the bug cannot be expressed as an automated test, state why and define the next-best repeatable proof.

## Design tests as executable specifications

- Name tests after behavior, scenario, and expected outcome.
- Prefer one behavioral assertion cluster per test over kitchen-sink tests.
- Use Arrange -> Act -> Assert or Given -> When -> Then consistently.
- Assert observable outcomes: returned values, persisted state, rendered UI, emitted events, logged errors, or external calls at true boundaries.
- Use parametrization for input grids, not copy-pasted tests.
- Add edge cases deliberately: empty, zero, null, max, malformed, concurrent, expired, unauthorized.
- Keep setup smaller than the behavior under test. If setup dominates the file, improve factories or fixtures.

## Data and mocking rules

### Data strategy

- Use factories, builders, fixtures, or seed helpers instead of ad hoc object creation in every test.
- Build the minimum graph needed to prove the behavior.
- Keep factory defaults valid and boring. Override only what the test cares about.
- Avoid fixtures that hide critical setup. If a test depends on a permission or feature flag, make that visible.

### Mocking strategy

- Mock external boundaries: network, cloud SDKs, file systems, queues, time, randomness, browser APIs, payment providers.
- Do not mock business logic, ORM internals, reducers, selectors, or components just to make tests easier.
- Freeze time when time matters.
- Seed randomness when randomness matters.
- Prefer realistic contract fixtures over handwritten partial payloads.

## Coverage is a signal, not the goal

Use coverage to locate blind spots, not to justify shallow tests.

- Diff coverage is usually more useful than only global coverage.
- Raise thresholds only on suites that are stable and meaningful.
- Exclude generated code, migrations, and framework glue deliberately and explicitly.
- Low coverage in critical domains matters more than high coverage in trivial wrappers.
- A line can be covered without the important branch being protected.

Useful threshold patterns:
- Unit and integration coverage gates on changed code for PRs
- Full-project coverage report on main or nightly
- Separate thresholds by package or domain when one global number hides risk

## Build a release-oriented test portfolio

Use different suites for different moments:

| Moment | Suites |
|---|---|
| Local tight loop | lint, types, focused unit or integration tests |
| PR gate | lint, types, targeted unit and integration, build |
| Merge to main | broader integration, selected e2e, security scans |
| Nightly | full suite, slow jobs, deep browsers, fuzz or property tests |
| Pre-release | smoke, migrations, rollout checks, synthetic monitoring |

Keep the fastest suites authoritative for everyday work. Slow suites should be valuable enough to justify their cost.

describe('LoginForm', () => {
  it('shows error when submitting empty fields', async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /login/i }))
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })

  it('calls onSubmit with email and password', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))
    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret' })
  })
})
```

**Do not:**
```tsx
// ❌ Testing implementation details
expect(component.state.isLoading).toBe(true)
expect(wrapper.find('Button').prop('disabled')).toBe(true)

// ✅ Testing behavior
expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
```

### Hook Tests

```tsx
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

it('increments count', () => {
  const { result } = renderHook(() => useCounter())
  act(() => result.current.increment())
  expect(result.current.count).toBe(1)
})
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('user can log in and see dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@example.com')
  await page.fill('[name=password]', 'secret')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})
```

**Playwright best practices:**
- Use `page.getByRole`, `page.getByLabel`, `page.getByText` — not CSS selectors
- Prefer `await expect(locator).toBeVisible()` over explicit waits
- Store reusable login in `storageState` to skip login on every test

---

## Mocking Rules

### Mock ONLY external boundaries

```
✅ Mock: requests.post, boto3.client, stripe.charge, fetch(), SMTP, file system
❌ Mock: Your own services, ORM/DB queries, serializers, business logic functions
```

### Mock at the highest useful abstraction

```python
# ❌ Too granular — brittle
mocker.patch('urllib3.connectionpool.HTTPConnectionPool.urlopen')

# ✅ Right level
mocker.patch('requests.post', return_value=Mock(json=lambda: {'ok': True}, status_code=200))
```

### Prefer real objects over mocks

```python
# ❌ Mock object
mock_user = Mock(id='123', email='test@example.com')

# ✅ Real factory object
user = user_factory(email='test@example.com')
```

### Assert mock calls sparingly

Only assert mock calls when testing an **integration point** (external API was called with correct args). Never assert mock calls to verify internal logic.

---

## Coverage Targets

| Area | Target |
|---|---|
| Business logic / services | 90%+ |
| API views / controllers | 85%+ |
| Models / data layer | 70%+ |
| Overall | 80%+ |
| Frontend components | 70%+ |
| Frontend hooks/utilities | 85%+ |

Treat these as directional minimums, not ceilings. Coverage without meaningful assertions is worthless.

**Enforce in CI:** Fail the build if coverage drops below threshold. Never lower the threshold to make CI pass.

---

## Parameterized Tests

Use parametrize to eliminate test duplication:

```python
@pytest.mark.parametrize('price,discount,expected', [
    (100, 0.2, 80.0),
    (50, 0.1, 45.0),
    (0, 0.5, 0.0),
])
def test_apply_discount(price, discount, expected):
    assert apply_discount(price, discount) == expected
```

```typescript
// Vitest
test.each([
  [100, 0.2, 80],
  [50, 0.1, 45],
])('apply_discount(%i, %f) = %i', (price, discount, expected) => {
  expect(applyDiscount(price, discount)).toBe(expected)
})
```

---

## Property-Based Testing

Use for non-trivial logic with large input spaces:

```python
from hypothesis import given, strategies as st

@given(st.text(min_size=1))
def test_normalize_str_is_idempotent(s):
    result = normalize(s)
    assert normalize(result) == result  # Normalizing twice == normalizing once
```

---

## Test Isolation Checklist

- No shared mutable state between tests
- Each test creates its own fixtures
- DB is rolled back after each test (pytest-django handles this)
- Time is frozen when testing time-dependent logic (`freezegun`, `vi.useFakeTimers`)
- Randomness is seeded when testing probabilistic logic
- Tests do not depend on execution order
