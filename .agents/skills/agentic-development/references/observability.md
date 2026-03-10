# Observability

Start investigations with the observability the repo already has. Adding new logs before reading existing signals is usually waste.

## Detection Order

1. Run the repo scan and note the observability section.
2. Read manifest files, env docs, and config files for existing vendors and wrappers.
3. Search for logging helpers, analytics clients, tracing setup, middleware, and custom log models.
4. Only then decide whether extra instrumentation is needed.

## Common Signal Types

- console logs and stderr or stdout
- standard logger wrappers such as `logging`, `structlog`, `winston`, `pino`, `loguru`
- error trackers such as Sentry, Rollbar, Bugsnag
- product analytics such as PostHog, Amplitude, Segment, Mixpanel
- feature flags such as LaunchDarkly
- tracing and metrics via OpenTelemetry, Datadog, New Relic, Honeycomb
- custom persistence such as database-backed log models or audit trails

## Investigation Flow

1. Reproduce the issue as narrowly as possible.
2. Capture the identifiers that let you correlate events: request id, user id, job id, conversation id, run id, trace id.
3. Inspect the existing logs, traces, or analytics first.
4. If those signals are insufficient, add the minimum new instrumentation in the system the repo already uses.
5. Remove temporary debug noise before finishing unless the repo explicitly keeps it.

## Adding Instrumentation

- Extend the existing vendor or wrapper instead of introducing a second competing path.
- Prefer structured fields over free-form string dumps.
- Avoid secrets, credentials, raw tokens, or unnecessary PII.
- Put backend logs near service boundaries and side effects, not scattered through every call site.
- Put frontend analytics on meaningful user actions and state transitions, not every click or render.

## Cloush-Style Example

Cloush uses both operational logger output and database-backed critical logging. That is a good pattern when the repo already distinguishes between routine telemetry and investigation-grade incidents. Reuse the established distinction instead of inventing new logging channels.
