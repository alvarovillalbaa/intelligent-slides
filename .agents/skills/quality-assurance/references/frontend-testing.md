# Frontend Testing Reference

## Scope

Use this reference for browser and UI behavior: components, state flows, async interactions, accessibility, routing, networked UI, and visual regressions.

## Pick the right UI test layer

| Behavior to prove | Preferred layer |
|---|---|
| pure formatter, selector, reducer, helper | unit |
| component behavior from a user perspective | component test |
| multi-component flow with mocked network | integration test |
| auth, routing, browser storage, real navigation | end-to-end |
| layout or styling regressions that matter visually | visual regression |

Do not use full-browser tests for logic that a component or integration test can prove more cheaply.

## Core rules

- Query the UI the way users perceive it: role, label, text, placeholder.
- Prefer user interactions over calling component internals directly.
- Assert loading, empty, error, success, and retry states.
- Control time and network explicitly.
- Avoid brittle selectors tied to DOM structure unless test IDs are the actual contract.

## Component and integration testing

For component-heavy apps:
- render through the same providers used in production when context matters
- keep data realistic but minimal
- use `userEvent` or equivalent for actual interaction semantics
- use `waitFor` or explicit async helpers, not arbitrary sleeps
- test accessibility names and keyboard flows where relevant

What to cover:
- input validation and disabled states
- optimistic updates and rollback on failure
- stale data and refetch behavior
- error banners, toasts, and inline errors
- routing transitions and preserved state

## Network control

Use request interception or a service worker layer rather than mocking every hook separately.

Good options:
- `msw` for browser and component tests
- explicit fetch or client stubs at the boundary for low-level tests
- contract fixtures for large API payloads

Bad options:
- mocking every hook, selector, component, and cache object in the tree
- snapshots of entire rendered apps instead of behavioral assertions

## Browser and end-to-end tests

Use Playwright, Cypress, or equivalent for flows where the browser itself is part of the risk:
- auth
- routing and redirects
- cookies, storage, or session persistence
- multi-page workflows
- rich drag-and-drop or upload flows
- accessibility or visual checks that require the real browser

Keep E2E stable by:
- seeding deterministic data
- using dedicated accounts or isolated environments
- resetting server state between tests
- collecting screenshots, videos, and traces on failure

## Accessibility and visual quality

Accessibility is part of QA, not a separate project.

Minimum checks for user-facing changes:
- semantic roles and accessible names
- keyboard access for primary flows
- visible focus states
- error messages tied to inputs
- color contrast or design-system guarantees where available

Visual regression helps when layout matters, but keep the baseline small and intentional. Review diffs like code, not as auto-approved noise.

## Frontend flake patterns

Most frontend flakes come from:
- waiting on implementation timing instead of state
- real network calls leaking into tests
- fake timers mixed with real promises incorrectly
- animations and transitions not disabled or awaited
- selectors tied to unstable DOM structure

Fix flakes by making state transitions explicit and observable.
