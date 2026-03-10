# Backend Development

Start by identifying where this backend expects business logic to live. Do not impose a generic architecture on a repo that already has strong patterns.

## Default Heuristics

- Keep transport layers thin. Controllers, views, handlers, and serializers should validate, delegate, and return.
- Put business rules, side effects, and orchestration in the repo's existing service, use-case, or domain layer.
- Reuse models, relations, and shared utilities before adding new tables, schemas, or service classes.
- Prefer one canonical path for a behavior instead of near-duplicate endpoints or helpers.
- Keep async or background work on the existing queue, job, or task system.
- Log at important boundaries and failure points with the repo's current logging approach.

## Data Model Bias

When the repo already prefers generalized models:

- favor reuse over new entity sprawl
- prefer relations over repeated fields
- use typed metadata or JSON fields only when validation remains clear
- centralize mixins and shared base behavior

When the repo prefers strict, explicit schemas, follow that instead.

## API Bias

In REST-oriented backends, prefer stable resource URLs and cohesive object-owned endpoints over parameter-heavy catch-all routes. If the repo already groups CRUD methods around one resource surface, keep doing that.

## Cloush-Style Translation

For backends shaped like Cloush:

- keep Django views and serializers thin
- put business logic in `services/`
- preserve centralized logging patterns
- favor multi-purpose models, shared mixins, and service-layer reuse
- prefer object-specific URLs such as `/api/x/<uuid>/` when that is the established API surface

This is a bias, not a mandate. Match the repo you are in.
